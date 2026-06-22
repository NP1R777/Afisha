import React from "react";
import Axios from "axios";
import axios from "../shared/lib/axios";
import { Button, Flex, HStack, Image, Text, VStack, Box, Spinner } from '@chakra-ui/react';
import fon from '../pictures/fon2.png';
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import EventImage from '../pictures/picture1.png';
import Organizer_picture from '../pictures/teatr.png';
import wave from '../pictures/wave31.png';
import { Calendar } from '../modal/org_calendar';
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
    time_slots?: TimeSlot[];
}

interface OrganizerNewsCard {
    id: number;
    name: string;
    location: string;
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

interface OrganizationsListResponse {
    total: number;
    items: OrganizationDetails[];
}

const CITY_LABELS: Record<string, string> = {
    norilsk: 'Норильск',
    talnah: 'Талнах',
    kayerkan: 'Кайеркан',
    oganeer: 'Оганер',
    dudinka: 'Дудинка',
};

function getErrorMessage(error: unknown, fallback: string): string {
    if (Axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        return typeof detail === 'string' ? detail : error.message || fallback;
    }
    return error instanceof Error ? error.message : fallback;
}

const Organizer = () => {
    const { organizationId } = useParams<{ organizationId: string }>();
    const navigate = useNavigate();
    const { userId, role, setRole } = useUser();
    const [organization, setOrganization] = React.useState<OrganizationDetails | null>(null);
    const organizerName = organization?.name_org || 'Организатор';
    const organizerAddress = organization?.address || 'Адрес не указан';
    const organizerLink = organization?.external_url || organization?.organizator || null;
    const organizerPicture = organization?.picture_org || Organizer_picture;
    const [roleResolved, setRoleResolved] = React.useState(false);
    const isOrganizerRole = role === 'organizator';
    const [events, setEvents] = React.useState<OrganizerEventCard[]>([]);
    const [newsEvents, setNewsEvents] = React.useState<OrganizerNewsCard[]>([]);
    const [loadingContent, setLoadingContent] = React.useState(false);
    const [contentError, setContentError] = React.useState<string | null>(null);

    const [currentIndex, setCurrentIndex] = React.useState(0); 
    const itemsPerPage = 4; 
    const visibleEvents = events.slice(currentIndex, currentIndex + itemsPerPage);

    const [newsIndex, setNewsIndex] = React.useState(0);

    const visibleNewsEvents = newsEvents.slice(
        newsIndex,
        newsIndex + itemsPerPage
    );

    const loadFirstOrganization = React.useCallback(async () => {
        const response = await axios.get<OrganizationsListResponse>('/organizations', {
            params: { limit: 1 },
        });
        const firstOrganization = response.data?.items?.[0];
        if (!firstOrganization?.id) {
            throw new Error('Организации пока не найдены.');
        }
        navigate(`/organizer/${firstOrganization.id}`, { replace: true });
    }, [navigate]);

    const loadOrganizerContent = React.useCallback(async () => {
        if (!organizationId) {
            setLoadingContent(true);
            setContentError(null);
            try {
                await loadFirstOrganization();
            } catch (error: unknown) {
                setOrganization(null);
                setEvents([]);
                setNewsEvents([]);
                setContentError(getErrorMessage(error, 'Не удалось найти организацию.'));
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
            setContentError('Некорректный идентификатор организации.');
            return;
        }

        setLoadingContent(true);
        setContentError(null);
        try {
            const response = await axios.get<OrganizationDetails>(`/organization/${parsedOrganizationId}`);
            const payload = response.data;
            const normalizedEvents = (Array.isArray(payload.events) ? payload.events : []).map((item) => {
                const cityRaw = (item?.city || '').toString().toLowerCase();
                const priceValue = Number(item?.price);
                return {
                    id: Number(item?.id),
                    name: String(item?.name || ''),
                    location: String(item?.address || CITY_LABELS[cityRaw] || 'Адрес не указан'),
                    price:
                        item?.price !== null && item?.price !== undefined && !Number.isNaN(priceValue)
                            ? priceValue
                            : null,
                    pictures_url:
                        String(
                            item?.pictures_main ||
                            item?.pictures_url ||
                            ''
                        ),
                    time_slots: item?.time_slots || [],
                } as OrganizerEventCard;
            }).filter((item: OrganizerEventCard) => Number.isFinite(item.id) && item.id > 0);

            const normalizedNews = (Array.isArray(payload.news) ? payload.news : []).map((item) => ({
                id: Number(item?.id),
                name: String(item?.name || ''),
                location: String(item?.address || item?.organizator || 'Новость без адреса'),
            } as OrganizerNewsCard)).filter((item: OrganizerNewsCard) => Number.isFinite(item.id) && item.id > 0);

            setOrganization(payload);
            setEvents(normalizedEvents);
            setNewsEvents(normalizedNews);
            setCurrentIndex(0);
            setNewsIndex(0);
        } catch (error: unknown) {
            setOrganization(null);
            setEvents([]);
            setNewsEvents([]);
            setContentError(getErrorMessage(error, 'Не удалось загрузить данные страницы.'));
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
                const response = await axios.get(`/user/get_user?user_id=${userId}`);
                const value = response.data?.role;
                if (!isCancelled && (value === 'user' || value === 'admin' || value === 'organizator')) {
                    setRole(value);
                }
            } catch {
                // silent fallback: page remains readable without privileged actions
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
            {organizerPicture && (
                <Box position="absolute" top={0} left={0} width="100%" height='100%' maxWidth="1960px">
                <Image
                    src={organizerPicture}
                    alt="Изображение мероприятия"
                    objectFit="cover"
                    objectPosition="top center"
                    width="100%"
                    height={{ base: '275px', sm:"320px", md: '430px', lg: '430px', xl: '540px', "2xl":'735px'}}
                    position="absolute"
                    top={0}
                    left={0}
                    zIndex={0}
                    onError={(event) => {
                        const target = event.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = Organizer_picture;
                    }}
                />
                <Image
                    src={fon}
                    alt="Overlay Image"
                    objectFit="cover"
                    width="100%"
                    height={{ base: '275px', sm:"320px", md: '430px', lg: '430px', xl: '540px', "2xl": '735px'}}
                    position="absolute"
                    top={0}
                    left={0}
                    zIndex={1}
                />
                </Box>
            )}
            <Box
                width="100%"
                maxW="1960px"
                px={{ base: 5, sm: 6, md: 10, lg: 16, xl: 24, "2xl": 100 }}
                mx="auto"
                zIndex={1}
                fontFamily="Unbounded" userSelect="none">
                <Text fontSize={{ "2xl": '70px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt="400px">
                    {organizerName}
                </Text>
                <Text fontSize={{ "2xl": '50px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt="50px">
                    Адрес
                </Text>
                <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white" mt={5}>
                    {organizerAddress}
                </Text>
                {organizerLink ? (
                <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white" mb={8} mt={5}>
                    <a
                    href={organizerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'white', textDecoration: 'underline' }}
                >
                    Ссылка на организатора
                </a>
                </Text>
                ) : null}
                <Text fontSize={{ "2xl": '48px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt={5}>
                    Ближайщие мероприятия организатора
                </Text>
                {loadingContent ? (
                    <Flex justify="center" mt="20px"><Spinner color="white" /></Flex>
                ) : null}
                {contentError ? (
                    <Box mt={3} bg="rgba(255, 93, 93, 0.2)" borderRadius="12px" p={3}>
                        <Text color="#ffd8d8">{contentError}</Text>
                    </Box>
                ) : null}
                <Flex justify="center" gap={8} mt="40px" zIndex={2}>
                    {visibleEvents.map((event, index) => (
                    <motion.div
                        key={`${event.id}-${index}`}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}>
                        <Link to={`/event/${event.id}`}>
                            <VStack
                                key={event.id}
                                align="center"
                                textAlign="center"
                                gap={1}
                                height="100%"
                                w={{ xl: '240px', sm: '200px', base: '140px' }}
                                position="relative"
                            >
                                <Image
                                    src={event.pictures_url || EventImage}
                                    alt={event.name}
                                    width="100%"
                                    height={{ xl: '360px', md: '300px', sm: "290px", base: '200px' }}
                                    borderRadius="6px"
                                    objectFit="cover"
                                />
                                <Box
                                    position="absolute"
                                    bottom="0"
                                    bgImage={`url(${wave})`}
                                    bgSize="cover"
                                    width={{ xl: '240px', sm: '200px', base: '140px' }}
                                    height="150px"
                                    p={2}
                                    borderRadius="md"
                                    textAlign="left"
                                    fontFamily="Unbounded"
                                    color="white">
                                    <Text
                                        fontWeight="hairline"
                                        mt={7}
                                        ml={2}
                                        fontSize={{ lg: '14px', base: '12px' }}
                                        style={{
                                            display: '-webkit-box',
                                            overflow: 'hidden',
                                            WebkitBoxOrient: 'vertical',
                                            WebkitLineClamp: 2,
                                        }}
                                        >
                                        {event.name}
                                    </Text>

                                    <Text fontSize={{ lg: '12px', base: '10px' }} ml={2}>
                                        {event.location}
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
                                    fontSize={{ xl: 'sm', base: 'xs' }}
                                    fontFamily="Unbounded">
                                    <Text>
                                        {event.price === null ? "Цена не указана" : Number(event.price) === 0 ? "Бесплатно" : `от ${event.price} руб`}
                                    </Text>
                                </Box>
                            </VStack>
                        </Link>
                    </motion.div>
                    ))}
                    {!loadingContent && visibleEvents.length === 0 ? (
                        <Text color="white" fontSize="18px">Нет доступных мероприятий.</Text>
                    ) : null}
                </Flex>
                <HStack justify="flex-end" mt={7} gap="15px" w={{ xl: '92%', lg: '88%' }}>
                    <Button
                        onClick={() => setCurrentIndex(currentIndex - itemsPerPage)}
                        disabled={currentIndex === 0}
                        bg="transparent"
                        borderRadius="full"
                        boxShadow="0 0 0 2px white"
                        width="50px"
                        height="50px"
                        _disabled={{ cursor: 'default' }}
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
                        _disabled={{ cursor: 'default' }}
                    >
                        <FaArrowRight color="white" />
                    </Button>
                </HStack> 
                <Text
                    fontSize={{ "2xl": '60px', lg: '40px', md: "30px", base: "20px" }}
                    color="white"
                    fontWeight="bold"
                    mt="10px"
                    textAlign="center"
                >
                    Новости
                </Text>

                <Flex justify="center" gap={8} mt="40px" zIndex={2}>
                    {visibleNewsEvents.map((event, index) => (
                        <motion.div
                            key={`news-${event.id}-${index}`}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                        >
                                <VStack
                                    align="center"
                                    textAlign="center"
                                    gap={1}
                                    height="100%"
                                    w={{ xl: '240px', sm: '200px', base: '140px' }}
                                    position="relative"
                                >
                                    <Image
                                        src={EventImage}
                                        alt={event.name}
                                        width="100%"
                                        height={{ xl: '360px', md: '300px', sm: "290px", base: '200px' }}
                                        borderRadius="6px"
                                        objectFit="cover"
                                    />

                                    <Box
                                        position="absolute"
                                        bottom="0"
                                        bgImage={`url(${wave})`}
                                        bgSize="cover"
                                        width={{ xl: '240px', sm: '200px', base: '140px' }}
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
                                            fontSize={{ lg: '14px', base: '12px' }}
                                            style={{
                                                display: '-webkit-box',
                                                overflow: 'hidden',
                                                WebkitBoxOrient: 'vertical',
                                                WebkitLineClamp: 2,
                                            }}
                                        >
                                            {event.name}
                                        </Text>

                                        <Text fontSize={{ lg: '12px', base: '10px' }} ml={2}>
                                            {event.location}
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
                                        fontSize={{ xl: 'sm', base: 'xs' }}
                                        fontFamily="Unbounded"
                                    >
                                        <Text>
                                            Новость
                                        </Text>
                                    </Box>
                                </VStack>
                        </motion.div>
                    ))}
                    {!loadingContent && visibleNewsEvents.length === 0 ? (
                        <Text color="white" fontSize="18px">Нет доступных новостей.</Text>
                    ) : null}
                </Flex>

                <HStack justify="flex-end" mt={7} gap="15px" w={{ xl: '92%', lg: '88%' }}>
                    <Button
                        onClick={() => setNewsIndex(newsIndex - itemsPerPage)}
                        disabled={newsIndex === 0}
                        bg="transparent"
                        borderRadius="full"
                        boxShadow="0 0 0 2px white"
                        width="50px"
                        height="50px"
                        _disabled={{ cursor: 'default', opacity: 0.5 }}
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
                        _disabled={{ cursor: 'default', opacity: 0.5 }}
                    >
                        <FaArrowRight color="white" />
                    </Button>
                </HStack>
                <Text fontSize={{ "2xl": '50px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt="40px" ml="55px" textAlign="center">
                    План мероприятий
                </Text>
                <Calendar
                    organizerName={organizerName}
                    canManageEvents={roleResolved && isOrganizerRole}
                    onEventCreated={loadOrganizerContent}
                />
            </Box>
        </Flex>
    );
};

export default Organizer;
