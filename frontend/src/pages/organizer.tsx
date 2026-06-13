import React from "react";
import axios from "../shared/lib/axios";
import { Button, Flex, HStack, Image, Text, VStack, Box, Grid} from '@chakra-ui/react';
import fon from '../pictures/fon2.png';
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import EVENTS from '../shared/config/mock.json';
import EventImage from '../pictures/picture1.png';
import Organizer_picture from '../pictures/teatr.png';
import wave from '../pictures/wave31.png';
import { Calendar } from '../modal/org_calendar';
import { useUser } from "../addition/context";

const Organizer = () => {
    const { userId, role, setRole } = useUser();
    const organizerName = 'Театр драмы им. В. Маяковского';
    const isOrganizerRole = role === 'organizator';
    const events = EVENTS.events;
    //для карточек мероприятий
    const [currentIndex, setCurrentIndex] = React.useState(0); 
    const itemsPerPage = 4; 
    const visibleEvents = events.slice(currentIndex, currentIndex + itemsPerPage);
    const theaterEvents = EVENTS.events.filter(event => {
    const category = EVENTS.categories.find(
        category => category.id === event.group_id
    );

        return category?.name.toLowerCase() === 'театр';
    });

    const [newsIndex, setNewsIndex] = React.useState(0);

    const visibleNewsEvents = theaterEvents.slice(
        newsIndex,
        newsIndex + itemsPerPage
    );

    React.useEffect(() => {
        let isCancelled = false;
        const loadRole = async () => {
            if (!userId || role) {
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
            }
        };
        void loadRole();
        return () => {
            isCancelled = true;
        };
    }, [role, setRole, userId]);

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
                <Text fontSize={{ "2xl": '70px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt="400px">
                    {organizerName}
                </Text>
                <Text fontSize={{ "2xl": '50px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt="50px">
                    Адрес
                </Text>
                <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white" mt={5}>
                    Улица Строителей, 17
                </Text>
                <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white" mb={8} mt={5}>
                    <a
                    href="https://кдц-высоцкого.рф/repertuar/?place=9a05e654-1532-4d5c-a486-d33fb5dbbc3f&city=7379699a-aff5-49a7-82b0-c53189dc2c44&language=ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'white', textDecoration: 'underline' }}
                >
                    Ссылка на организатора
                </a>
                </Text>
                <Text fontSize={{ "2xl": '48px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt={5}>
                    Ближайщие мероприятия организатора
                </Text>
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
                                        {Number(event.price) === 0 ? "Бесплатно" : `от ${event.price} руб`}
                                    </Text>
                                </Box>
                            </VStack>
                        </Link>
                    </motion.div>
                    ))}
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
                            <Link to={`/event/${event.id}`}>
                                <VStack
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
                                            {Number(event.price) === 0
                                                ? "Бесплатно"
                                                : `от ${event.price} руб`}
                                        </Text>
                                    </Box>
                                </VStack>
                            </Link>
                        </motion.div>
                    ))}
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
                        disabled={newsIndex + itemsPerPage >= theaterEvents.length}
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
                <Calendar organizerName={organizerName} canManageEvents={isOrganizerRole} />
            </Box>
        </Flex>
    );
};

export default Organizer;
