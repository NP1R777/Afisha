import { Box, Button, Flex, Grid, Text, Image } from '@chakra-ui/react';
import { RadioGroup } from "../components/ui/radio";
import Modal from 'react-modal';
import { useState } from 'react';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger } from '../components/ui/select';
import { createListCollection } from '@ark-ui/react';
import cloud from '../pictures/cloud.png';
import cloud2 from '../pictures/cloud2.png';
import left from '../pictures/lev1.png';
import right from '../pictures/prav1.png';
import tickets from '../pictures/tickets.png';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type EventItem = {
    title: string;
    category: string;
    date: string;
    time: string;
    organizer: string;
};

const EventCalendarModal = ({ isOpen, onClose }: Props) => {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 5));
    const [selectedAge, setSelectedAge] = useState('');
    const [isAgeOpen, setIsAgeOpen] = useState(false);

    const ageRestrictions = createListCollection({
        items: [
            { label: '0+', value: '0+' },
            { label: '6+', value: '6+' },
            { label: '12+', value: '12+' },
            { label: '16+', value: '16+' },
            { label: '18+', value: '18+' },
        ],
    });

    const handleAgeChange = (values: string[]) => {
        setSelectedAge(values[0] || '');
    };

    const groupByOrganizer = (events: EventItem[]) => {
        return events.reduce((acc, event) => {
            if (!acc[event.organizer]) {
                acc[event.organizer] = [];
            }

            acc[event.organizer].push(event);

            return acc;
        }, {} as Record<string, EventItem[]>);
    };

    const events: EventItem[] = [
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-11',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-12',
            time: '20:30',
        },{
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-13',
            time: '20:30',
        },
        {
            title: 'Крадотелетарадыр',
            category: 'theatre', 
            organizer: 'Заполярный театр драмы',
            date: '2026-06-14',
            time: '12:00',
        },
        {
            title: 'Тартюф',
            category: 'theatre', 
            organizer: 'Заполярный театр драмы',
            date: '2026-06-14',
            time: '18:00',
        },
        {
            title: '#ЛЮБЛЮНЕМОГУ#',
            category: 'theatre', 
            organizer: 'Заполярный театр драмы',
            date: '2026-06-14',
            time: '18:00',
        },
        {
            title: 'Движение севера',
            category: 'theatre', 
            organizer: 'Городской центр культуры',
            date: '2026-06-14',
            time: '18:00',
        },
                {
            title: 'На всякого мудреца довольно простоты',
            category: 'theatre', 
            organizer: 'Кинотеатр "Родина"',
            date: '2026-06-15',
            time: '20:30',
        },
                {
            title: 'Та сторона, где ветер',
            category: 'museum', 
            organizer: 'Кинотеатр "Родина"',
            date: '2026-06-16',
            time: '21:30',
        },
        {
            title: 'Волки и овцы',
            category: 'museum', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-18',
            time: '10:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Кинотеатр "Родина"',
            date: '2026-06-21',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Кинотеатр "Родина"',
            date: '2026-05-22',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-23',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Дворец спорта "Арктика"',
            date: '2026-06-27',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Дворец спорта "Арктика"',
            date: '2026-06-30',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-18',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Дворец спорта "Арктика"',
            date: '2026-06-18',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-15',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Дворец спорта "Арктика"',
            date: '2026-06-15',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-30',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-30',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-22',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-22',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-22',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-27',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-27',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-27',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-20',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-26',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-26',
            time: '20:30',
        },
        {
            title: 'На всякого мудреца довольно простоты',
            category: 'cinema', 
            organizer: 'Театр драмы им. В. Маяковского',
            date: '2026-06-28',
            time: '20:30',
        },

    ];
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);//фильтр по категориям

    const filteredEvents =
        selectedCategories.length === 0
            ? events
            : events.filter(e => selectedCategories.includes(e.category));

    const formatDisplayDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
            return `${day}.${month}.${year}`;
        };
    type CalendarDay = {
        day: number;
        type: 'prev' | 'current' | 'next';
    };
    
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);

    const formatDate = (year: number, month: number, day: number) => {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    };

    const eventsByDate = filteredEvents.reduce((acc, event) => {
        if (!acc[event.date]) acc[event.date] = [];
        acc[event.date] = [...acc[event.date], event];
        return acc;
    }, {} as Record<string, typeof events>);


    const getCalendarDays = (date: Date): CalendarDay[] => {
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const startDay = (firstDayOfMonth.getDay() + 6) % 7;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const days: { day: number; type: 'prev' | 'current' | 'next' }[] = [];

        // 🔹 предыдущий месяц
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({
                day: daysInPrevMonth - i,
                type: 'prev',
            });
        }

        // 🔹 текущий месяц
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                type: 'current',
            });
        }

        // 🔹 следующий месяц (добиваем до 42 ячеек = 6 недель)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                day: i,
                type: 'next',
            });
        }

        return days;
    };

    const getMonthTitle = (date: Date) => {
        let str = date.toLocaleString('ru-RU', {
            month: 'long',
            year: 'numeric',
        });
        str = str.replace(' г.', '');
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

   const handlePrevMonth = () => {
        const today = new Date();

        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();

        const isCurrentMonth =
            currentMonth === todayMonth &&
            currentYear === todayYear;

        if (isCurrentMonth) return;

        setCurrentDate(
            prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
        );
    };

    const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    const days = getCalendarDays(currentDate);

    const categories = createListCollection({
        items: [
            { label: 'Театр', value: 'theatre' },
            { label: 'Кино', value: 'cinema' },
            { label: 'Музей', value: 'museum' },
        ],
    }); 

    const handleCategoryChange = (values: string[]) => {
        setSelectedCategories(values);
    };//для фильтра категорий

    const today = new Date();

    const isPrevDisabled =
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();

    return (
        <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        style={{
            overlay: {
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            },
            content: {
            inset: '50% auto auto 50%',
            transform: 'translate(-50%, -50%)',
            padding: 0,
            border: 'none',
            borderRadius: '20px',
            maxWidth: '700px',
            width: '90%',
            background: '#22212C',
            },
        }}>
            <Box p={5} color="white" fontFamily="Unbounded">
                <Flex justify="center" align="center" mb={1} gap={12}>
                    <Image
                        src={cloud2}
                        alt="decor-left"
                        boxSize="80px"
                        objectFit="contain"
                    />

                    <Text fontSize="30px" fontWeight="bold" textAlign="center">
                        Календарь событий
                    </Text>

                    <Image
                        src={cloud}
                        alt="decor-right"
                        boxSize="80px"
                        objectFit="contain"
                    />
                </Flex>
                <Box bg="white" borderRadius="xl" p={4} color="black" fontWeight="medium">
                    <Text textAlign="center" mb={3} fontSize="20px">
                        {getMonthTitle(currentDate)}
                    </Text>

                    {/* Дни недели */}
                    <Grid templateColumns="repeat(7, 1fr)" gap={2} mb={2}>
                    {['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(day => (
                        <Text key={day} textAlign="center" fontSize="sm">
                            {day}
                        </Text>
                    ))}
                    </Grid>

                    {/* Сетка календаря */}
                    <Grid templateColumns="repeat(7, 1fr)" gap={2} overflow="visible">
                        {days.map((item, i) => {
                            const column = i % 7;

                            const tooltipStyle: any = {
                                top: "50%",
                                transform: "translateY(-120%)",
                            };

                            if (column === 0) {
                                // левый край
                                tooltipStyle.left = "0";
                                tooltipStyle.transform = "translateY(-120%)";
                            } else if (column === 6) {
                                // правый край
                                tooltipStyle.right = "0";
                                tooltipStyle.transform = "translateY(-120%)";
                            } else {
                                // центр
                                tooltipStyle.left = "50%";
                                tooltipStyle.transform = "translate(-50%, -120%)";
                            }
                            
                            const dateStr =
                                item.type === 'current'
                                    ? formatDate(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth(),
                                        item.day
                                    )
                                    : '';
                            const today = new Date();
                            const hasEvents = dateStr && eventsByDate[dateStr];
                            const eventsCount = dateStr && eventsByDate[dateStr]
                                ? eventsByDate[dateStr].length
                                : 0;
                            const groupedEvents =
                                dateStr && eventsByDate[dateStr]
                                    ? groupByOrganizer(eventsByDate[dateStr])
                                    : null;
                            const currentMonth = currentDate.getMonth();
                            const currentYear = currentDate.getFullYear();

                            const todayMonth = today.getMonth();
                            const todayYear = today.getFullYear();
                            
                            let bgColor = '#EAEAEA';
                            let textColor = 'gray.500';

                            if (item.type === 'current') {

                                const isPastMonth =
                                    currentYear < todayYear ||
                                    (currentYear === todayYear && currentMonth < todayMonth);

                                const isFutureMonth =
                                    currentYear > todayYear ||
                                    (currentYear === todayYear && currentMonth > todayMonth);

                                const isCurrentMonth =
                                    currentYear === todayYear && currentMonth === todayMonth;

                                if (isPastMonth) {
                                    bgColor = '#A3B3F2';
                                    textColor = 'white';
                                }

                                if (isFutureMonth) {
                                    if (eventsCount <= 1) {
                                        bgColor = '#6F8CFF'; // красный
                                    } else if (eventsCount <= 3) {
                                        bgColor = '#0021A6'; // желтый
                                    } else {
                                        bgColor = '#000E47'; // зеленый
                                    }

                                    textColor = 'white';
                                }

                                if (isCurrentMonth) {
                                    // прошедшие дни
                                    if (item.day < today.getDate()) {
                                        bgColor = '#C9D4FF';
                                        textColor = 'white';
                                    } else {
                                        // будущие дни текущего месяца
                                        if (eventsCount <= 1) {
                                            bgColor = '#6F8CFF';
                                        } else if (eventsCount <= 3) {
                                            bgColor = '#0021A6';
                                        } else {
                                            bgColor = '#000E47';
                                        }

                                        textColor = 'white';
                                    }
                                }
                            }

                        return (
                            <Box
                                key={i}
                                height="60px"
                                borderRadius="md"
                                bg={bgColor}
                                color={textColor}
                                position="relative"
                                display="flex"
                                alignItems="flex-start"
                                justifyContent="flex-start"
                                pt={1}
                                pl={2}
                                fontSize="sm"
                                onMouseEnter={() => dateStr && setHoveredDate(dateStr)}
                                onMouseLeave={() => setHoveredDate(null)}
                                overflow="visible"
                            >
                                {item.day}
                                {hasEvents && (
                                <Box
                                    position="absolute"
                                    bottom="-2px"
                                    right="4px"
                                >
                                    <Image
                                        src={tickets}
                                        alt="decor-left"
                                        boxSize="35px"
                                        objectFit="contain"
                                    />
                                </Box>
                            )}
                                {hoveredDate === dateStr && eventsByDate[dateStr] && (
                                    <Box
                                        position="absolute"
                                        top="50%"
                                        // left="50%"
                                        // transform="translate(-50%, -120%)"
                                        {...tooltipStyle}
                                        bg="#34333C"
                                        color="white"
                                        p={3}
                                        borderRadius="xl"
                                        zIndex={20}
                                        w="250px"
                                        boxShadow="xl" 
                                        textAlign="center"
                                    >
                                        {/* Дата */}
                                        <Text fontSize="13px" mb={2} fontWeight="medium">
                                            {formatDisplayDate(dateStr)}
                                        </Text>

                                        {/* Белый бокс */}
                                        <Box bg="white" color="black" borderRadius="lg" p={2} textAlign="left">
                                        {groupedEvents &&
                                            Object.entries(groupedEvents).map(([organizer, events]) => (
                                                <Box key={organizer} mb={2}>
                                                    {/* Организатор */}
                                                    <Text
                                                        fontWeight="bold"
                                                        fontSize="13px"
                                                        mb={1}
                                                    >
                                                        {organizer}
                                                    </Text>

                                                    {/* События */}
                                                    {events.map((event, idx) => (
                                                        <Flex
                                                            key={idx}
                                                            justify="space-between"
                                                            align="center"
                                                            fontSize="sm"
                                                            mb={1}
                                                        >
                                                            <Text fontSize="10px">
                                                                {event.title}
                                                            </Text>

                                                            <Text
                                                                fontSize="10px"
                                                                whiteSpace="nowrap"
                                                            >
                                                                {event.time}
                                                            </Text>
                                                        </Flex>
                                                    ))}
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                    </Grid>
                </Box>

                <Flex justify="space-between" align="center" mt={6}>
                    <Flex gap={3}>
                        {/* Все события */}
                        <SelectRoot
                            width="180px"
                            display="inline-block"
                            className="light"
                            size={{ base: 'sm', md: 'md' }}
                            multiple
                            collection={categories}
                            bg="white"
                            overflow="hidden"
                            borderRadius="full"
                            onValueChange={(e) => handleCategoryChange(e.value)}
                        >
                            <SelectTrigger>
                                <Box
                                    textWrap="nowrap"
                                    px={2}
                                    py={2}
                                    fontSize={{ base: '8px', sm: "12px", md: 'sm' }}
                                    color="black"
                                    cursor="pointer"
                                >
                                    Все события
                                </Box>
                            </SelectTrigger>

                            <SelectContent borderRadius="xl">
                                {categories.items.map(category => (
                                    <SelectItem item={category} key={category.value}>
                                        {category.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>

                        {/* Возрастное ограничение */}
                        <Box position="relative">
                        {/* Кнопка */}
                        <Button
                            bg="white"
                            color="black"
                            borderRadius="full"
                            fontSize={{ base: '8px', sm: '12px', md: 'sm' }}
                            px={4}
                            py={2}
                            onClick={() => setIsAgeOpen(prev => !prev)}
                            _hover={{ bg: 'white' }}
                            _active={{ bg: 'white' }}
                        >
                            {selectedAge ? `${selectedAge}+` : 'Возраст'}
                        </Button>

                        {/* Выпадающий список */}
                        
                            <Box
                                position="absolute"
                                bottom="110%"
                                left={0}
                                bg="white"
                                borderRadius="xl"
                                p={3}
                                boxShadow="lg"
                                zIndex={100}
                                minW="130px"
                                opacity={isAgeOpen ? 1 : 0}
                                transform={isAgeOpen ? 'translateY(0)' : 'translateY(10px)'}
                                transition="all 0.2s ease"
                                pointerEvents={isAgeOpen ? 'auto' : 'none'}
                            >
                                <Flex direction="column" gap={2}>
                                    {['0', '6', '12', '16', '18'].map(age => (
                                        <Flex
                                            key={age}
                                            align="center"
                                            gap={2}
                                            cursor="pointer"
                                            onClick={() => {
                                                setSelectedAge(age);
                                                setIsAgeOpen(false);
                                            }}
                                        >
                                            <Box
                                                w="16px"
                                                h="16px"
                                                border="2px solid"
                                                borderColor="gray.400"
                                                borderRadius="full"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                            >
                                                {selectedAge === age && (
                                                    <Box
                                                        w="8px"
                                                        h="8px"
                                                        bg="blue.500"
                                                        borderRadius="full"
                                                    />
                                                )}
                                            </Box>

                                            <Text color="black">
                                                {age}+
                                            </Text>
                                        </Flex>
                                    ))}
                                </Flex>
                            </Box>
                        
                    </Box>
                    </Flex>

                    {/* 🔹 Правая часть — кнопки */}
                    <Flex gap={2}>
                        <Button
                            onClick={handlePrevMonth}
                            p={1}
                            borderRadius="full"
                            variant="ghost"
                            opacity={isPrevDisabled ? 0.4 : 1}
                            cursor={isPrevDisabled ? 'default' : 'pointer'}
                            _hover={{ bg: "transparent" }}
                            _active={{ bg: "transparent" }}
                        >
                            <Image src={left} boxSize="40px" />
                        </Button>

                        <Button
                            onClick={handleNextMonth}
                            p={1}
                            borderRadius="full"
                            variant="ghost"
                            _hover={{ bg: "transparent" }}
                            _active={{ bg: "transparent" }}
                        >
                            <Image src={right} boxSize="40px" />
                        </Button>
                    </Flex>

                </Flex>
            </Box>
        </Modal>
    );
};

export default EventCalendarModal;