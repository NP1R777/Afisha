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
import { useMediaQuery } from '@chakra-ui/react';
import { useParams } from "react-router-dom";

interface TimeSlot {
    date_event: string;
    start_time: string;
}

interface OrganizerEventCard {
    id: number;
    name: string;
    location: string;
    price: number | null;
    pictures_main: string;
    organization: number | string;
    time_slots?: TimeSlot[];
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
   const { id } = useParams<{ id: string }>();
    const ORGANIZER_ID = Number(id);

    const [organizer, setOrganizer] = React.useState<OrganizerInfo | null>(null);

    const [roleResolved, setRoleResolved] = React.useState(false);
    const isOrganizerRole = role === 'organizator';
    const [events, setEvents] = React.useState<OrganizerEventCard[]>([]);
    const [newsEvents, setNewsEvents] = React.useState<OrganizerNewsCard[]>([]);
    const [loadingContent, setLoadingContent] = React.useState(false);
    const [contentError, setContentError] = React.useState<string | null>(null);

    const [currentIndex, setCurrentIndex] = React.useState(0); 
    const [isMd, isXl] = useMediaQuery(
        ['(min-width: 768px)', '(min-width: 1280px)']
        );
        const itemsPerPage = (() => {
        if (isXl) return 4;
        if (isMd) return 3;
        return 2;
        })();
    // const visibleEvents = events.slice(currentIndex, currentIndex + itemsPerPage); убраа и добавила нижнее для филтрации вручную
interface OrganizerInfo {
    id: number;
    name_org: string;
    address: string | null;
    organizator: string | null;
    description: string;
    picture_org: string;
    external_url: string | null;
    events: OrganizerEventCard[];
    news: OrganizerNewsCard[];
}
    const [newsIndex, setNewsIndex] = React.useState(0);

    const visibleNewsEvents = newsEvents.slice(
        newsIndex,
        newsIndex + itemsPerPage
    );

    
    const loadOrganizerContent = React.useCallback(async () => {
    setLoadingContent(true);
    setContentError(null);

    try {
        const response = await axios.get(
            `/organization/${ORGANIZER_ID}?events_limit=50&news_limit=50`
        );

        const data = response.data;

        setOrganizer(data);

        setEvents(data.events ?? []);
        setNewsEvents(data.news ?? []);

        setCurrentIndex(0);
        setNewsIndex(0);

    } catch (err: any) {
        const detail = err?.response?.data?.detail;

        setOrganizer(null);
        setEvents([]);
        setNewsEvents([]);

        setContentError(
            typeof detail === 'string'
                ? detail
                : err?.message || 'Не удалось загрузить данные'
        );
    } finally {
        setLoadingContent(false);
    }
}, []);



const visibleEvents = events.slice(
    currentIndex,
    currentIndex + itemsPerPage
);

const calendarEvents = React.useMemo(() => {
    return events.flatMap(e =>
        (e.time_slots || []).map(slot => ({
            id: e.id,
            date: slot.date_event.split("T")[0],
            title: e.name,
            time: slot.start_time.slice(0, 5),
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
            
                <Box position="absolute" top={0} left={0} width="100%" height='100%' maxWidth="1960px">
                <Image
                    src={organizer?.picture_org}
                    alt="Изображение мероприятия"
                    objectFit="cover"
                    objectPosition="top center"
                    width="100%"
                    height={{ base: '350px', sm:"320px", md: '430px', lg: '430px', xl: '540px', "2xl":'735px'}}
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
                    height={{ base: '350px', sm:"320px", md: '430px', lg: '430px', xl: '540px', "2xl": '735px'}}
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
                              mt={{ base: '150px', md: '320px', xl: '440px' }}
                            >
                              <Heading
                                as="h1"
                                color="white"
                                fontSize={{ "2xl": '62px', lg: '46px', md: "34px", sm: "24px", base: "25px" }}
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
                                {organizer?.name_org ?? 'Организатор'}
                              </Heading>
            
                            </VStack>
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.46, ease: 'easeOut', delay: 0.14 }}
                    >
                    <Box
                        mt={{ md: 9, base: 6}}
                        bg="rgba(17, 23, 58, 0.5)"
                        border="1px solid rgba(255,255,255,0.2)"
                        borderRadius="22px"
                        p={{ base: 3, md: 6 }}
                        backdropFilter="blur(6px)"
                    >
                <Text fontSize={{ "2xl": '50px', lg: '40px', md: "30px", base: "25px" }} color="white" fontWeight="bold" >
                    Адрес
                </Text>
                <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white" mt={{md: "5", base: "2" }}>
                    {organizer?.address || 'Адрес не указан'}
                </Text>
                {organizer?.external_url && (
                        <Text
                            fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }}
                            color="white"
                            mt={{ md: "5", base: "2" }}
                        >
                            <a
                                href={organizer.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: 'white',
                                    textDecoration: 'underline',
                                }}
                            >
                                Ссылка на организатора
                            </a>
                        </Text>
                    )}
                </Box>
            </motion.div>
            <Box
                mt={{ md: 9, base: 3}}
                w={{base: "320px", sm: "450px", xl: "1100px"}}
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
                <Text fontSize={{ "2xl": '48px', lg: '40px', md: "30px", base: "25px" }} color="white" fontWeight="bold" mt={{md: "5", base: "1" }} textAlign="center">
                    Ближайщие мероприятия организатора
                </Text>
                {loadingContent ? (
                    <Flex justify="center" mt="20px"><Spinner color="white" /></Flex>
                ) : null}
               
                <Flex justify="center" gap={{ base: 2, sm: 4, xl: 8 }} mt={{ base: '15px', lg: '40px', xl: '60px' }} zIndex={2}>
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
                                src={event.pictures_main || EventImage}
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
                <HStack justify="flex-end" mt={4} w={{ xl: '100%', lg: '88%' }}>
                    <Button
                        onClick={() =>
                            setCurrentIndex(prev =>
                                Math.max(prev - itemsPerPage, 0)
                            )
                        }
                        disabled={currentIndex === 0}
                        bg="transparent"
                        borderRadius="full"
                        mr={2}
                        boxShadow="0 0 0 2px white"
                        width={{ xl: '50px', sm: '45px', base: '40px' }}
                        height={{ xl: '50px', sm: '45px', base: '40px' }}
                        _disabled={{ cursor: 'default' }}
                        >
                        <FaArrowLeft color="white" />
                    </Button>

                    <Button
                        onClick={() =>
                            setCurrentIndex(prev =>
                                Math.min(
                                    prev + itemsPerPage,
                                    Math.max(events.length - itemsPerPage, 0)
                                )
                            )
                        }
                        disabled={
                            currentIndex + itemsPerPage >= events.length
                        }
                        bg="transparent"
                        borderRadius="full"
                        boxShadow="0 0 0 2px white"
                        width={{ xl: '50px', sm: '45px', base: '40px' }}
                        height={{ xl: '50px', sm: '45px', base: '40px' }}
                        _disabled={{ cursor: 'default' }}
                    >
                        <FaArrowRight color="white" />
                    </Button>
                </HStack> 
                </Box>
                {newsEvents.length > 0 && (
                <Box
                mt={{ base: 3, md: 9 }}
                w={{base: "320px", sm: "450px", xl: "1100px"}}
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

                <Flex justify="center" gap={{ base: 2, sm: 4, xl: 8 }} mt={{ base: '15px', lg: '40px', xl: '60px' }} zIndex={2}>
                    
                    {visibleNewsEvents.map((event, index) => (
                        <motion.div
                        key={`${event.id}-${index}`}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                    >
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
                                    src={EventImage}
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
                                    <Text>Новость</Text>
                                </Box>
                                </VStack>
                        
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
                        width={{ xl: '50px', sm: '45px', base: '40px' }}
height={{ xl: '50px', sm: '45px', base: '40px' }}
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
                        width={{ xl: '50px', sm: '45px', base: '40px' }}
height={{ xl: '50px', sm: '45px', base: '40px' }}
                        _disabled={{ cursor: 'default', opacity: 0.5 }}
                    >
                        <FaArrowRight color="white" />
                    </Button>
                </HStack>
                </Box>
                )}
                <Text fontSize={{ "2xl": '50px', lg: '40px', md: "30px", base: "28px" }} color="white" fontWeight="bold" mt={{ md: "40px", base: "15px" }} ml={{ md: "55px", base: "10px" }} textAlign="center">
                    План мероприятий
                </Text>
                <Calendar events={calendarEvents}/>
            </Box>
            
        </Flex>
    );
};

export default Organizer;
