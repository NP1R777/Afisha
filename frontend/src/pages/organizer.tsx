import React from "react";
import Axios from "axios";
import apiClient from "../shared/lib/axios";
import { Box, Button, Flex, HStack, Heading, Image, Spinner, Text, VStack } from "@chakra-ui/react";
import fon from "../pictures/fon2.png";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import EventImage from "../pictures/picture1.png";
import OrganizerPictureFallback from "../pictures/teatr.png";
import wave from "../pictures/wave31.png";
import { Calendar } from "../modal/org_calendar";
import { useUser } from "../addition/context";

interface TimeSlot {
  date_event: string;
  start_time: string;
}

interface OrganizerEventCard {
  id: number;
  name: string;
  location: string;
  price: number | null;
  pictures_url: string;
  time_slots: TimeSlot[];
}

interface OrganizerNewsCard {
  id: number;
  name: string;
  location: string;
}

interface OrganizationDetails {
  id: number;
  name_org: string;
  address: string | null;
  description: string | null;
  picture_org: string | null;
  external_url: string | null;
  organizator: string | null;
  events: OrganizationEventResponse[];
  news: OrganizationNewsResponse[];
}

interface OrganizationEventResponse {
  id?: number;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  price?: number | string | null;
  pictures_main?: string | null;
  pictures_url?: string | null;
  time_slots?: TimeSlot[];
}

interface OrganizationNewsResponse {
  id?: number;
  name?: string | null;
  address?: string | null;
  organizator?: string | null;
}

interface OrganizationsListResponse {
  total: number;
  items: OrganizationDetails[];
}

const CITY_LABELS: Record<string, string> = {
  norilsk: "Норильск",
  talnah: "Талнах",
  kayerkan: "Кайеркан",
  oganeer: "Оганер",
  dudinka: "Дудинка",
};

function normalizeEvent(item: OrganizationEventResponse): OrganizerEventCard {
  const cityRaw = (item?.city || "").toString().toLowerCase();
  const priceValue = Number(item.price);
  return {
    id: Number(item?.id),
    name: String(item?.name || ""),
    location: String(item?.address || CITY_LABELS[cityRaw] || "Адрес не указан"),
    price:
      item?.price !== null && item?.price !== undefined && !Number.isNaN(priceValue)
        ? priceValue
        : null,
    pictures_url: String(item?.pictures_main || item?.pictures_url || ""),
    time_slots: Array.isArray(item?.time_slots) ? item.time_slots : [],
  };
}

function normalizeNews(item: OrganizationNewsResponse): OrganizerNewsCard {
  return {
    id: Number(item?.id),
    name: String(item?.name || ""),
    location: String(item?.address || item?.organizator || "Новость без адреса"),
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (Axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    return typeof detail === "string" ? detail : error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

const Organizer = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { userId, role, setRole } = useUser();
  const [roleResolved, setRoleResolved] = React.useState(false);
  const isOrganizerRole = role === "organizator";
  const [organization, setOrganization] = React.useState<OrganizationDetails | null>(null);
  const [events, setEvents] = React.useState<OrganizerEventCard[]>([]);
  const [newsEvents, setNewsEvents] = React.useState<OrganizerNewsCard[]>([]);
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [contentError, setContentError] = React.useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [newsIndex, setNewsIndex] = React.useState(0);
  const itemsPerPage = 4;

  const visibleEvents = events.slice(currentIndex, currentIndex + itemsPerPage);
  const visibleNewsEvents = newsEvents.slice(newsIndex, newsIndex + itemsPerPage);
  const organizerName = organization?.name_org || "Организатор";
  const organizerImage = organization?.picture_org || OrganizerPictureFallback;
  const organizerAddress = organization?.address || "Адрес не указан";
  const organizerExternalUrl = organization?.external_url || organization?.organizator || null;
  const organizerDescription = organization?.description || "Информация об организации отсутствует";

  const loadFirstOrganization = React.useCallback(async () => {
    const response = await apiClient.get<OrganizationsListResponse>("/organizations", {
      params: { limit: 1 },
    });
    const firstOrganization = response.data?.items?.[0];
    if (!firstOrganization?.id) {
      throw new Error("Организации пока не найдены.");
    }
    navigate(`/organizer/${firstOrganization.id}`, { replace: true });
  }, [navigate]);

  const loadOrganizerContent = React.useCallback(async () => {
    if (!organizationId) {
      setLoadingContent(true);
      setContentError(null);
      try {
        await loadFirstOrganization();
      } catch (err: unknown) {
        setOrganization(null);
        setEvents([]);
        setNewsEvents([]);
        setContentError(getErrorMessage(err, "Не удалось найти организацию."));
      } finally {
        setLoadingContent(false);
      }
      return;
    }

    const parsedOrganizationId = Number(organizationId);
    if (!Number.isInteger(parsedOrganizationId) || parsedOrganizationId <= 0) {
      setOrganization(null);
      setEvents([]);
      setNewsEvents([]);
      setContentError("Некорректный идентификатор организации.");
      return;
    }

    setLoadingContent(true);
    setContentError(null);
    try {
      const response = await apiClient.get<OrganizationDetails>(`/organization/${parsedOrganizationId}`);
      const payload = response.data;
      const normalizedEvents = (Array.isArray(payload.events) ? payload.events : [])
        .map(normalizeEvent)
        .filter((item) => Number.isFinite(item.id) && item.id > 0);
      const normalizedNews = (Array.isArray(payload.news) ? payload.news : [])
        .map(normalizeNews)
        .filter((item) => Number.isFinite(item.id) && item.id > 0);

      setOrganization(payload);
      setEvents(normalizedEvents);
      setNewsEvents(normalizedNews);
      setCurrentIndex(0);
      setNewsIndex(0);
    } catch (err: unknown) {
      setOrganization(null);
      setEvents([]);
      setNewsEvents([]);
      setContentError(getErrorMessage(err, "Не удалось загрузить данные организации."));
    } finally {
      setLoadingContent(false);
    }
  }, [loadFirstOrganization, organizationId]);

  React.useEffect(() => {
    let isCancelled = false;
    const loadRole = async () => {
      if (!userId) {
        if (!isCancelled) {
          setRoleResolved(true);
        }
        return;
      }
      try {
        const response = await apiClient.get(`/user/get_user?user_id=${userId}`);
        const value = response.data?.role;
        if (!isCancelled && (value === "user" || value === "admin" || value === "organizator")) {
          setRole(value);
        }
      } catch {
        // Page remains readable even if role refresh fails.
      } finally {
        if (!isCancelled) {
          setRoleResolved(true);
        }
      }
    };
    void loadRole();
    return () => {
      isCancelled = true;
    };
  }, [setRole, userId]);

  React.useEffect(() => {
    void loadOrganizerContent();
  }, [loadOrganizerContent]);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [organizationId]);

  return (
    <Flex w="100%">
      <Box position="absolute" top={0} left={0} width="100%" height="100%" maxWidth="1960px">
        <Image
          src={organizerImage}
          alt={organizerName}
          objectFit="cover"
          objectPosition="top center"
          width="100%"
          height={{ base: "275px", sm: "320px", md: "430px", lg: "430px", xl: "540px", "2xl": "735px" }}
          position="absolute"
          top={0}
          left={0}
          zIndex={0}
          onError={(event) => {
            const target = event.target as HTMLImageElement;
            target.onerror = null;
            target.src = OrganizerPictureFallback;
          }}
        />
        <Image
          src={fon}
          alt="Overlay Image"
          objectFit="cover"
          width="100%"
          height={{ base: "275px", sm: "320px", md: "430px", lg: "430px", xl: "540px", "2xl": "735px" }}
          position="absolute"
          top={0}
          left={0}
          zIndex={1}
        />
      </Box>

      <Box
        width="100%"
        maxW="1960px"
        px={{ base: 5, sm: 6, md: 10, lg: 16, xl: 24, "2xl": 100 }}
        mx="auto"
        zIndex={1}
        fontFamily="Unbounded"
        userSelect="none"
      >
        <VStack
          align="start"
          gap={{ base: 2, md: 4 }}
          justifyContent="flex-end"
          bg="rgba(18, 22, 52, 0.48)"
          border="1px solid rgba(255,255,255,0.2)"
          borderRadius="20px"
          px={{ base: 3, md: 6 }}
          py={{ base: 3, md: 5 }}
          backdropFilter="blur(6px)"
          mt={{ base: "220px", md: "320px", xl: "440px" }}
        >
          <Heading
            as="h1"
            color="white"
            fontSize={{ "2xl": "62px", lg: "46px", md: "34px", sm: "24px", base: "20px" }}
            fontWeight="700"
            fontFamily="Unbounded"
            lineHeight={{ base: 1.15, md: 1.08 }}
            textAlign="start"
            maxWidth={{ "2xl": "860px", lg: "560px", md: "450px", sm: "340px", base: "230px" }}
            style={{
              textShadow: "0 10px 28px rgba(0, 0, 0, 0.35)",
              display: "-webkit-box",
              overflow: "hidden",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
            }}
          >
            {organizerName}
          </Heading>
        </VStack>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.46, ease: "easeOut", delay: 0.14 }}
        >
          <Box
            mt={9}
            bg="rgba(17, 23, 58, 0.5)"
            border="1px solid rgba(255,255,255,0.2)"
            borderRadius="22px"
            p={{ base: 3, md: 6 }}
            backdropFilter="blur(6px)"
          >
            <Text fontSize={{ "2xl": "50px", lg: "40px", md: "30px", base: "20px" }} color="white" fontWeight="bold">
              Об организации
            </Text>
            <Text fontSize={{ "2xl": "20px", lg: "16px", md: "14px", base: "12px" }} color="white" mt={5} lineHeight={1.7}>
              {organizerDescription}
            </Text>
            <Text fontSize={{ "2xl": "28px", lg: "24px", md: "20px", base: "16px" }} color="white" fontWeight="bold" mt={6}>
              Адрес
            </Text>
            <Text fontSize={{ "2xl": "20px", lg: "15px", md: "14px", base: "10px" }} color="white" mt={3}>
              {organizerAddress}
            </Text>
            {organizerExternalUrl ? (
              <Text fontSize={{ "2xl": "20px", lg: "15px", md: "14px", base: "10px" }} color="white" mt={5}>
                <a
                  href={organizerExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "white", textDecoration: "underline" }}
                >
                  Ссылка на организатора
                </a>
              </Text>
            ) : null}
          </Box>
        </motion.div>

        <Box
          mt={9}
          w={{ base: "100%", xl: "1100px" }}
          p={4}
          color="white"
          userSelect="none"
          zIndex={0}
          bg="rgba(17, 23, 58, 0.5)"
          border="1px solid rgba(255,255,255,0.15)"
          borderRadius="24px"
          boxShadow="0 14px 30px rgba(7, 11, 34, 0.24)"
          mx="auto"
        >
          <Text fontSize={{ "2xl": "48px", lg: "40px", md: "30px", base: "20px" }} color="white" fontWeight="bold" mt={5} textAlign="center">
            Ближайшие мероприятия организатора
          </Text>
          {loadingContent ? (
            <Flex justify="center" mt="20px">
              <Spinner color="white" />
            </Flex>
          ) : null}
          {contentError ? (
            <Box mt={3} bg="rgba(255, 93, 93, 0.2)" borderRadius="12px" p={3}>
              <Text color="#ffd8d8">{contentError}</Text>
            </Box>
          ) : null}

          <Flex justify="center" gap={8} mt="40px" zIndex={2} flexWrap="wrap">
            {visibleEvents.map((event, index) => (
              <motion.div
                key={`${event.id}-${index}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <Link to={`/event/${event.id}`}>
                  <VStack
                    align="center"
                    textAlign="center"
                    mb={{ xl: 0, md: 0.1 }}
                    gap={1}
                    height="100%"
                    w={{ xl: "240px", sm: "200px", base: "140px" }}
                    position="relative"
                    transition="all .22s ease"
                    _hover={{
                      transform: "translateY(-4px)",
                      filter: "drop-shadow(0 14px 24px rgba(8, 14, 40, 0.42))",
                    }}
                  >
                    <Image
                      src={event.pictures_url || EventImage}
                      alt={event.name}
                      width="100%"
                      height={{ xl: "360px", md: "300px", sm: "290px", base: "200px" }}
                      borderRadius="6px"
                      objectFit="cover"
                      boxShadow="0 10px 24px rgba(11, 16, 42, 0.34)"
                      onError={(imageEvent) => {
                        const target = imageEvent.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = EventImage;
                      }}
                    />
                    <Box
                      position="absolute"
                      bottom={{ xl: "0px", md: "0.1px", base: "0px" }}
                      bgImage={`url(${wave})`}
                      bgSize="cover"
                      width={{ xl: "240px", sm: "200px", base: "140px" }}
                      height="150px"
                      p={2}
                      borderRadius="md"
                      textAlign="left"
                      fontFamily="Unbounded"
                      color="white"
                    >
                      <Text
                        fontWeight="hairline"
                        mt={7}
                        ml={2}
                        fontSize={{ lg: "14px", base: "12px" }}
                        style={{
                          display: "-webkit-box",
                          overflow: "hidden",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                        }}
                      >
                        {event.name}
                      </Text>
                    </Box>
                    <Box
                      position="absolute"
                      bottom="10px"
                      right="10px"
                      bgColor="white"
                      color="black"
                      borderRadius="xl"
                      p={1}
                      fontSize={{ xl: "sm", base: "xs" }}
                      fontFamily="Unbounded"
                      border="1px solid rgba(12, 24, 70, 0.2)"
                      boxShadow="0 6px 16px rgba(13, 18, 45, 0.2)"
                    >
                      <Text>{event.price === null ? "Цена не указана" : event.price === 0 ? "Бесплатно" : `от ${event.price} руб`}</Text>
                    </Box>
                  </VStack>
                </Link>
              </motion.div>
            ))}
            {!loadingContent && visibleEvents.length === 0 ? (
              <Text color="white" fontSize="18px">Нет доступных мероприятий.</Text>
            ) : null}
          </Flex>
          <HStack justify="flex-end" mt={7} gap="15px" w={{ xl: "100%", lg: "88%" }}>
            <Button
              onClick={() => setCurrentIndex(currentIndex - itemsPerPage)}
              disabled={currentIndex === 0}
              bg="transparent"
              borderRadius="full"
              boxShadow="0 0 0 2px white"
              width="50px"
              height="50px"
              _disabled={{ cursor: "default" }}
            >
              <FaArrowLeft color="white" />
            </Button>
            <Button
              onClick={() => setCurrentIndex(currentIndex + itemsPerPage)}
              disabled={currentIndex + itemsPerPage >= events.length}
              bg="transparent"
              borderRadius="full"
              boxShadow="0 0 0 2px white"
              width="50px"
              height="50px"
              _disabled={{ cursor: "default" }}
            >
              <FaArrowRight color="white" />
            </Button>
          </HStack>
        </Box>

        <Box
          mt={9}
          w={{ base: "100%", xl: "1100px" }}
          p={4}
          color="white"
          userSelect="none"
          zIndex={0}
          bg="rgba(17, 23, 58, 0.5)"
          border="1px solid rgba(255,255,255,0.15)"
          borderRadius="24px"
          boxShadow="0 14px 30px rgba(7, 11, 34, 0.24)"
          mx="auto"
        >
          <Text fontSize={{ "2xl": "48px", lg: "40px", md: "30px", base: "20px" }} color="white" fontWeight="bold" mt={5} textAlign="center">
            Новости
          </Text>
          <Flex justify="center" gap={8} mt="40px" zIndex={2} flexWrap="wrap">
            {visibleNewsEvents.map((item, index) => (
              <motion.div
                key={`news-${item.id}-${index}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <Box
                  w={{ xl: "240px", sm: "200px", base: "140px" }}
                  minH="180px"
                  borderRadius="18px"
                  bg="rgba(255,255,255,0.14)"
                  border="1px solid rgba(255,255,255,0.2)"
                  p={4}
                  boxShadow="0 10px 24px rgba(11, 16, 42, 0.28)"
                >
                  <Text fontSize={{ lg: "15px", base: "12px" }} fontWeight="700">
                    {item.name}
                  </Text>
                  <Text fontSize={{ lg: "12px", base: "10px" }} mt={3}>
                    {item.location}
                  </Text>
                </Box>
              </motion.div>
            ))}
            {!loadingContent && visibleNewsEvents.length === 0 ? (
              <Text color="white" fontSize="18px">У организатора пока нет новостей.</Text>
            ) : null}
          </Flex>
          <HStack justify="flex-end" mt={7} gap="15px" w={{ xl: "100%", lg: "88%" }}>
            <Button
              onClick={() => setNewsIndex(newsIndex - itemsPerPage)}
              disabled={newsIndex === 0}
              bg="transparent"
              borderRadius="full"
              boxShadow="0 0 0 2px white"
              width="50px"
              height="50px"
              _disabled={{ cursor: "default", opacity: 0.5 }}
            >
              <FaArrowLeft color="white" />
            </Button>
            <Button
              onClick={() => setNewsIndex(newsIndex + itemsPerPage)}
              disabled={newsIndex + itemsPerPage >= newsEvents.length}
              bg="transparent"
              borderRadius="full"
              boxShadow="0 0 0 2px white"
              width="50px"
              height="50px"
              _disabled={{ cursor: "default", opacity: 0.5 }}
            >
              <FaArrowRight color="white" />
            </Button>
          </HStack>
        </Box>

        <Text fontSize={{ "2xl": "50px", lg: "40px", md: "30px", base: "20px" }} color="white" fontWeight="bold" mt="40px" ml="55px" textAlign="center">
          План мероприятий
        </Text>
        <Calendar events={events} />
        {!roleResolved || isOrganizerRole ? null : (
          <Text color="white" opacity={0.72} fontSize="12px" textAlign="center" mt={3}>
            Управление событиями доступно только пользователям с ролью организатора.
          </Text>
        )}
      </Box>
    </Flex>
  );
};

export default Organizer;
