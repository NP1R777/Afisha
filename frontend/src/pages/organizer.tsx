import React from "react";
import axios from "../shared/lib/axios";
import { Button, Flex, HStack, Image, Text, VStack, Box, Grid, Spinner,Heading } from '@chakra-ui/react';
import fon from '../pictures/fon2.png';
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
    organization: number | string;
    time_slots?: TimeSlot[]; // 👈 ВАЖНО
}

interface OrganizerNewsCard {
    id: number;
    name: string;
    location: string;
}

const CITY_LABELS: Record<string, string> = {
    norilsk: 'Норильск',
    talnah: 'Талнах',
    kayerkan: 'Кайеркан',
    oganeer: 'Оганер',
    dudinka: 'Дудинка',
};

const Organizer = () => {
    const { userId, role, setRole } = useUser();
    const organizerName = 'Заполярный театр драмы';
    const [roleResolved, setRoleResolved] = React.useState(false);
    const isOrganizerRole = role === 'organizator';
    const [events, setEvents] = React.useState<OrganizerEventCard[]>([]);
    const [newsEvents, setNewsEvents] = React.useState<OrganizerNewsCard[]>([]);
    const [loadingContent, setLoadingContent] = React.useState(false);
    const [contentError, setContentError] = React.useState<string | null>(null);

    const [currentIndex, setCurrentIndex] = React.useState(0); 
    const itemsPerPage = 4; 
    // const visibleEvents = events.slice(currentIndex, currentIndex + itemsPerPage); убраа и добавила нижнее для филтрации вручную


    const [newsIndex, setNewsIndex] = React.useState(0);

    const visibleNewsEvents = newsEvents.slice(
        newsIndex,
        newsIndex + itemsPerPage
    );

    const loadOrganizerContent = React.useCallback(async () => {
        setLoadingContent(true);
        setContentError(null);
        try {
            const [eventsResult, newsResult] = await Promise.allSettled([
                axios.get('/event/events'),
                axios.get('/news/all'),
            ]);

            const eventsData =
                eventsResult.status === 'fulfilled' && Array.isArray(eventsResult.value.data)
                    ? eventsResult.value.data
                    : [];
            const normalizedEvents = eventsData.map((item: any) => {
                const cityRaw = (item?.city || '').toString().toLowerCase();
                return {
                    id: Number(item?.id),
                    name: String(item?.name || ''),
                    location: String(item?.address || CITY_LABELS[cityRaw] || 'Адрес не указан'),
                    price:
                        item?.price !== null && item?.price !== undefined && !Number.isNaN(Number(item.price))
                            ? Number(item.price)
                            : null,
                    pictures_url:
                        String(
                            item?.pictures_main ||
                            item?.pictures_url ||
                            ''
                        ),
                    organization: item?.organization,
                    time_slots: item?.time_slots || [],
                } as OrganizerEventCard;
            }).filter((item: OrganizerEventCard) => Number.isFinite(item.id) && item.id > 0);

            const newsData =
                newsResult.status === 'fulfilled' && Array.isArray(newsResult.value.data)
                    ? newsResult.value.data
                    : [];
            const normalizedNews = newsData.map((item: any) => ({
                id: Number(item?.id),
                name: String(item?.name || ''),
                location: String(item?.address || item?.organizator || 'Новость без адреса'),
            } as OrganizerNewsCard)).filter((item: OrganizerNewsCard) => Number.isFinite(item.id) && item.id > 0);
            
            setEvents(normalizedEvents);
            setNewsEvents(normalizedNews);
            setCurrentIndex(0);
            setNewsIndex(0);

            const eventError =
                eventsResult.status === 'rejected' && eventsResult.reason?.response?.status !== 404
                    ? eventsResult.reason
                    : null;
            const newsError =
                newsResult.status === 'rejected' && newsResult.reason?.response?.status !== 404
                    ? newsResult.reason
                    : null;
            const firstError = eventError || newsError;
            if (firstError) {
                const detail = firstError?.response?.data?.detail;
                setContentError(typeof detail === 'string' ? detail : (firstError?.message || 'Часть данных не загрузилась.'));
            }
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            setEvents([]);
            setNewsEvents([]);
            setContentError(typeof detail === 'string' ? detail : (err?.message || 'Не удалось загрузить данные страницы.'));
        } finally {
            setLoadingContent(false);
        }
    }, []);
    const filteredEvents = React.useMemo(() => {
    return events.filter(
        (event) => Number(event.organization) === 1
    );
}, [events]);

const visibleEvents = filteredEvents.slice(
    currentIndex,
    currentIndex + itemsPerPage
);

const calendarEvents = React.useMemo(() => {
  return events
    .filter(e => Number(e.organization) === 1)
    .flatMap(e =>
      (e.time_slots || []).map(slot => ({
        date: slot.date_event.split("T")[0], // 👉 2026-06-18
        title: e.name,
        time: slot.start_time.slice(0, 5) // 👉 21:25
      }))
    );
}, [events]);

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
}, []);
    return (
        <Flex w="100%">
            {Organizer_picture && (
                <Box position="absolute" top={0} left={0} width="100%" height='100%' maxWidth="1960px">
                <Image
                    src={Organizer_picture}
                    alt="Изображение мероприятия"
                    objectFit="cover"
                    objectPosition="top center"
                    width="100%"
                    height={{ base: '275px', sm:"320px", md: '430px', lg: '430px', xl: '540px', "2xl":'735px'}}
                    position="absolute"
                    top={0}
                    left={0}
                    zIndex={0}
                    onError={(e) => {
                        const parentBox = e.currentTarget.parentElement;
                        if (parentBox) parentBox.style.display = 'none';
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
                    <VStack
                              align="start"
                              gap={{ base: 2, md: 4}}
                              justifyContent="flex-end"
                              bg="rgba(18, 22, 52, 0.48)"
                              border="1px solid rgba(255,255,255,0.2)"
                              borderRadius="20px"
                              px={{ base: 3, md: 6 }}
                              py={{ base: 3, md: 5 }}
                              backdropFilter="blur(6px)"
                              mt={{ base: '220px', md: '320px', xl: '440px' }}
                            >
                              <Heading
                                as="h1"
                                color="white"
                                fontSize={{ "2xl": '62px', lg: '46px', md: "34px", sm: "24px", base: "20px" }}
                                fontWeight="700"
                                fontFamily="Unbounded"
                                lineHeight={{ base: 1.15, md: 1.08 }}
                                textAlign="start"
                                maxWidth={{ "2xl": '860px', lg: '560px', md: "450px", sm: "340px", base: "230px" }}
                                style={{
                                  textShadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
                                  display: '-webkit-box',
                                  overflow: 'hidden',
                                  WebkitLineClamp: 4,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {organizerName}
                              </Heading>
            
                            </VStack>
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.46, ease: 'easeOut', delay: 0.14 }}
                    >
                    <Box
                        mt={9}
                        bg="rgba(17, 23, 58, 0.5)"
                        border="1px solid rgba(255,255,255,0.2)"
                        borderRadius="22px"
                        p={{ base: 3, md: 6 }}
                        backdropFilter="blur(6px)"
                    >
                <Text fontSize={{ "2xl": '50px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" >
                    Адрес
                </Text>
                <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white" mt={5}>
                    Улица Строителей, 17
                </Text>
                <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white"  mt={5}>
                    <a
                    href="https://кдц-высоцкого.рф/repertuar/?place=9a05e654-1532-4d5c-a486-d33fb5dbbc3f&city=7379699a-aff5-49a7-82b0-c53189dc2c44&language=ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'white', textDecoration: 'underline' }}
                >
                    Ссылка на организатора
                </a>
                </Text>
                </Box>
            </motion.div>
            <Box
                mt={9}
                w={{base: "700px", xl: "1100px"}}
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
                <Text fontSize={{ "2xl": '48px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt={5} textAlign="center">
                    Ближайщие мероприятия организатора
                </Text>
                {loadingContent ? (
                    <Flex justify="center" mt="20px"><Spinner color="white" /></Flex>
                ) : null}
               
                <Flex justify="center" gap={8} mt="40px" zIndex={2}>
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
                                w={{ xl: '240px', sm: '200px', base: '140px' }}
                                position="relative"
                                transition="all .22s ease"
                                _hover={{
                                    transform: 'translateY(-4px)',
                                    filter: 'drop-shadow(0 14px 24px rgba(8, 14, 40, 0.42))',
                                }}
                                >
                                <Image
                                    src={event.pictures_url || EventImage}
                                    alt={event.name}
                                    width="100%"
                                    height={{ xl: '360px', md: '300px', sm: "290px", base: '200px' }}
                                    borderRadius="6px"
                                    objectFit="cover"
                                    boxShadow="0 10px 24px rgba(11, 16, 42, 0.34)"
                                    onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = EventImage;
                                    }}
                                />
                                <Box
                                    position="absolute"
                                    bottom={{  xl: '0px', md: '0.1px', base: '0px' }}
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
                                    border="1px solid rgba(12, 24, 70, 0.2)"
                                    boxShadow="0 6px 16px rgba(13, 18, 45, 0.2)"
                                >
                                    <Text>{Number(event.price) === 0 ? 'Бесплатно' : `от ${event.price} руб`}</Text>
                                </Box>
                                </VStack>
                        </Link>
                    </motion.div>
                    ))}
                    {!loadingContent && visibleEvents.length === 0 ? (
                        <Text color="white" fontSize="18px">Нет доступных мероприятий.</Text>
                    ) : null}
                </Flex>
                <HStack justify="flex-end" mt={7} gap="15px" w={{ xl: '100%', lg: '88%' }}>
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
                </Box>
                {/* <Box
                mt={9}
                w={{base: "700px", xl: "1100px"}}
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
                                w={{ xl: '240px', sm: '200px', base: '140px' }}
                                position="relative"
                                transition="all .22s ease"
                                _hover={{
                                    transform: 'translateY(-4px)',
                                    filter: 'drop-shadow(0 14px 24px rgba(8, 14, 40, 0.42))',
                                }}
                                >
                                <Image
                                    src={event.pictures_url || EventImage}
                                    alt={event.name}
                                    width="100%"
                                    height={{ xl: '360px', md: '300px', sm: "290px", base: '200px' }}
                                    borderRadius="6px"
                                    objectFit="cover"
                                    boxShadow="0 10px 24px rgba(11, 16, 42, 0.34)"
                                    onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = EventImage;
                                    }}
                                />
                                <Box
                                    position="absolute"
                                    bottom={{  xl: '0px', md: '0.1px', base: '0px' }}
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
                                    border="1px solid rgba(12, 24, 70, 0.2)"
                                    boxShadow="0 6px 16px rgba(13, 18, 45, 0.2)"
                                >
                                    <Text>Прочитать новость</Text>
                                </Box>
                                </VStack>
                        </Link>
                    </motion.div>
                    ))}
                    {!loadingContent && visibleNewsEvents.length === 0 ? (
                        <Text color="white" fontSize="18px">У организатора пока нет новостей</Text>
                    ) : null}
                </Flex>

                <HStack justify="flex-end" mt={7} gap="15px" w={{ xl: '100%', lg: '88%' }}>
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
                </Box> */}
                <Text fontSize={{ "2xl": '50px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt="40px" ml="55px" textAlign="center">
                    План мероприятий
                </Text>
                <Calendar />
            </Box>
        </Flex>
    );
};

export default Organizer;
