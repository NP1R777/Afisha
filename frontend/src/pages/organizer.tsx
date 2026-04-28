import React from "react";
import { Button, Flex, HStack, Image, Text, VStack, Box, Grid} from '@chakra-ui/react';
import fon from '../pictures/fon2.png';
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import EVENTS from '../shared/config/mock.json';
import EventImage from '../pictures/picture1.png';
import Organizer_picture from '../pictures/teatr.png';
import wave from '../pictures/wave31.png';

const Organizer = () => {
    const events = EVENTS.events;
    //для карточек мероприятий
    const [currentIndex, setCurrentIndex] = React.useState(0); 
    const itemsPerPage = 5; 
    const visibleEvents = events.slice(currentIndex, currentIndex + itemsPerPage);
    //для календаря
    const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const months = [
        "Январь", "Февраль", "Март", "Апрель",
        "Май", "Июнь", "Июль", "Август",
        "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ];
    const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    //для календаря
    const [hoveredDate, setHoveredDate] = React.useState<string | null>(null); //хранение даты на которую наведена мышь
    type Day = { value: number, isCurrentMonth: boolean };

    //генерация календаря
    function generateDaysForMonth(monthIndex: number): Day[] {
        const year = 2026;
        const daysInMonth = monthLengths[monthIndex];
        const startDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
        const daysArray: Day[] = [];
        const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
        const prevMonthDays = monthLengths[prevMonthIndex];

        for (let i = startDay - 1; i >= 0; i--) {
            daysArray.push({ value: prevMonthDays - i, isCurrentMonth: false });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            daysArray.push({ value: d, isCurrentMonth: true });
        }

        let nextMonthDay = 1;
        while (daysArray.length < 42) {
            daysArray.push({ value: nextMonthDay, isCurrentMonth: false });
            nextMonthDay++;
        }
        return daysArray;
    }

    //для даты в клендаре с мероприятиями
    const testEvents = [
    {
        date: "2026-01-12",
        title: "Спектакль Гамлет",
        time: "18:00"
    },
    {
        date: "2026-01-12",
        title: "Балет Лебединое озеро",
        time: "20:00"
    },
    {
        date: "2026-03-18",
        title: "Ревизор",
        time: "19:00"
    },
    {
        date: "2026-07-01",
        title: "Концерт симфонический",
        time: "17:30"
    },
    {
        date: "2026-12-05",
        title: "Щелкунчик",
        time: "18:00"
    }
    ];

    //Получение событий по дню
    function getEventsForDay(day: Day, monthIndex: number) {
        if (!day.isCurrentMonth) return [];
        const month = String(monthIndex + 1).padStart(2, "0");
        const date = String(day.value).padStart(2, "0");
        const fullDate = `2026-${month}-${date}`;
        return testEvents.filter(e => e.date === fullDate);
    }

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
                    Театр драмы им. В. Маяковского
                </Text>
                <Text fontSize={{ "2xl": '50px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt="50px">
                    Адрес
                </Text>
                <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white" mt={5}>
                    Улица Строителей, 17
                </Text>
                <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white" mb={8} mt={5}>
                    Подробная информация от организатора:
                    <br />
                    <a
                        target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>
                        https://кдц-высоцкого.рф/repertuar/?place=9a05e654-1532-4d5c-a486-d33fb5dbbc3f&city=7379699a-aff5-49a7-82b0-c53189dc2c44&language=ru
                    </a>
                </Text>
                <Text fontSize={{ "2xl": '45px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt={5}>
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
                <HStack justify="flex-end" mt={7} gap="15px">
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
                <Text fontSize={{ "2xl": '50px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt="20px" ml="55px" textAlign="center">
                    План будущих мероприятий
                </Text>
                {/* календарь */}
                <Box bg="#6B84EA"  w="95%" py={7} borderRadius="20px" mt={10} ml="auto">
                    <VStack gap={6} align="center" >
                        <Box
                        bg="#A3B3F2"
                        color="white"
                        px={4}
                        py={2}
                        borderRadius="20px"
                        >
                        <Text fontSize="xl" textAlign="center">
                            2026 год
                        </Text>
                        </Box>
                        <Grid templateColumns="repeat(4, 1fr)" gap={6}>
                            {Array.from({ length: 12 }).map((_, i) => (
                            <Box
                                key={i}
                                bg="#A3B3F2"
                                borderRadius="20px"
                                p={4}
                                color="white"
                                w="270px"
                                boxShadow="lg"
                            >
                                <Text fontWeight="bold" mb={2} textAlign="center">
                                    {months[i]}
                                </Text>

                                <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
                                    {days.map((d) => (
                                        <Text key={d} fontSize="xs" textAlign="center" opacity={0.8}>
                                        {d}
                                        </Text>
                                    ))}
                                </Grid>

                                <Grid templateColumns="repeat(7, 1fr)" gap={1}>
                                    {generateDaysForMonth(i).map((day, idx) => {
                                        const eventsForDay = getEventsForDay(day, i);
                                        const active = eventsForDay.length > 0;

                                        const month = String(i + 1).padStart(2, "0");
                                        const date = String(day.value).padStart(2, "0");
                                        const fullDate = `2026-${month}-${date}`;

                                        return ( //появляющийся квадрат с мероприятиями
                                        <Box key={idx} position="relative">
                                            <Box
                                            textAlign="center"
                                            fontSize="sm"
                                            p={1}
                                            borderRadius="6px"
                                            bg={active ? "#6B84EA" : "transparent"} //цвет квадрата маленького
                                            color={
                                                active
                                                ? "white"
                                                : day.isCurrentMonth
                                                ? "white"
                                                : "gray.400"
                                            }
                                            cursor={active ? "pointer" : "default"}
                                            _hover={
                                                active
                                                ? { bg: "#4C6BE6" }
                                                : {}
                                            }
                                            onMouseEnter={() => active && setHoveredDate(fullDate)}
                                            onMouseLeave={() => setHoveredDate(null)}
                                            >
                                            {day.value}
                                            </Box>

                                            {/* ВСПЛЫВАЮЩИЙ КВАДРАТ */}
                                            {active && hoveredDate === fullDate && (
                                            <Box
                                                position="absolute"
                                                bottom="120%"
                                                left="50%"
                                                transform="translateX(-50%)"
                                                bg="#4C6BE6"
                                                color="white"
                                                p={3}
                                                borderRadius="10px"
                                                w="250px"
                                                zIndex={10}
                                                boxShadow="lg"
                                            >
                                                {/* ДАТА */}
                                            <Text
                                                textAlign="center"
                                                fontWeight="bold"
                                                fontSize="sm"
                                                mb={2}
                                            >
                                                {fullDate.split("-").reverse().join(".")}
                                            </Text>

                                            {/* СПИСОК СОБЫТИЙ */}
                                            <VStack align="start" gap={2}>
                                                {eventsForDay.map((event, index) => (
                                                <Box key={index} w="100%">
                                                <Flex justify="space-between" align="center" fontSize="sm">
                                                    <Text fontWeight="medium">
                                                    {event.title}
                                                    </Text>

                                                    <Text alignSelf="flex-start">
                                                    {event.time}
                                                    </Text>
                                                </Flex>
                                                </Box>
                                                ))}
                                            </VStack>
                                            </Box>
                                            )}
                                        </Box>
                                        );
                                    })}
                                </Grid>
                            </Box>
                            ))}
                        </Grid>
                    </VStack>
                </Box>
            </Box>
        </Flex>
    );
};

export default Organizer;
