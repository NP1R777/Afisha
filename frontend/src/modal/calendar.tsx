import { Box, Button, Flex, Grid, Text, Image } from '@chakra-ui/react';
import { RadioGroup } from "../components/ui/radio";
import Modal from 'react-modal';
import axios from '../shared/lib/axios';
import { useState, useEffect } from 'react';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger } from '../components/ui/select';
import { createListCollection } from '@ark-ui/react';
import cloud from '../pictures/cloud.png';
import cloud2 from '../pictures/cloud2.png';
import left from '../pictures/lev1.png';
import right from '../pictures/prav1.png';
import tickets from '../pictures/tickets.png';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type EventItem = {
    slot_id: number;
    event_id: number;
    date: string;
    time: string;
    title: string;
    age_limit: string | null;
    organizer: string;
    is_organizer_event: boolean;
};

const EventCalendarModal = ({ isOpen, onClose }: Props) => {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 5));
    const [selectedAge, setSelectedAge] = useState('');
    const [isAgeOpen, setIsAgeOpen] = useState(false);
    const navigate = useNavigate();
const isMobile = window.innerWidth < 768;
    const ageRestrictions = createListCollection({
        items: [
            { label: '0+', value: '0+' },
            { label: '6+', value: '6+' },
            { label: '12+', value: '12+' },
            { label: '16+', value: '16+' },
            { label: '18+', value: '18+' },
        ],
    });

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const fetchCalendarEvents = async () => {
        try {

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const dateFrom =
                `${year}-${String(month + 1).padStart(2,'0')}-01`;

            const lastDay =
                new Date(year, month + 1, 0).getDate();

            const dateTo =
                `${year}-${String(month + 1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;


            const url =
                `/event/calendar/events?date_from=${dateFrom}&date_to=${dateTo}` +
                (selectedAge ? `&age_values=${selectedAge}` : '');

            const response = await axios.get(url);

            setEvents(response.data.items);

        }
        catch(error){
            console.error(error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCalendarEvents();
        }
    }, [isOpen, currentDate, selectedAge]);

    useEffect(() => {
    if (!selectedDate) return;

    const timer = setTimeout(() => {
        setSelectedDate(null);
    }, 2500);

    return () => clearTimeout(timer);
}, [selectedDate]);

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

    const [events, setEvents] = useState<EventItem[]>([]);
    
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);//фильтр по категориям


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

    const eventsByDate = events.reduce((acc, event) => {

        if (!acc[event.date]) {
            acc[event.date] = [];
        }

        acc[event.date].push(event);

        return acc;

    }, {} as Record<string, EventItem[]>);


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

                width: '95%',
                maxWidth: '700px',

                maxHeight: '95vh',
                overflow: 'auto',

                background: '#22212C',
            },
        }}>
            <Box p={{base:3, md:5}} color="white" fontFamily="Unbounded">
                <Flex justify="center" align="center" mb={1} gap={{base:2, md:12}}>
                    <Image
                        src={cloud2}
                        alt="decor-left"
                        boxSize={{base:'40px', md:'80px'}}
                        objectFit="contain"
                    />

                    <Text fontSize={{base:'16px', md:'30px'}} fontWeight="bold" textAlign="center">
                        Календарь событий
                    </Text>

                    <Image
                        src={cloud}
                        alt="decor-right"
                        boxSize={{base:'40px', md:'80px'}}
                        objectFit="contain"
                    />
                </Flex>
                <Box bg="white" borderRadius="xl" p={{base:2, md:4}} color="black" fontWeight="medium">
                    <Text textAlign="center" mb={3} fontSize={{base:'16px', md:'20px'}}>
                        {getMonthTitle(currentDate)}
                    </Text>

                    {/* Дни недели */}
                    <Grid templateColumns="repeat(7, 1fr)" gap={2} mb={2}>
                    {['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(day => (
                        <Text key={day} textAlign="center" fontSize={{base:'10px', md:'sm'}}>
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
                                
                                tooltipStyle.left = "0";
                                tooltipStyle.transform = "translateY(-120%)";
                            } else if (column === 6) {
                                
                                tooltipStyle.right = "0";
                                tooltipStyle.transform = "translateY(-120%)";
                            } else {
                                
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
                                        bgColor = '#6F8CFF';
                                    } else if (eventsCount <= 3) {
                                        bgColor = '#0021A6';
                                    } else {
                                        bgColor = '#000E47';
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
                                height={{base:'40px', md:'60px'}}
                                borderRadius="md"
                                bg={bgColor}
                                color={textColor}
                                position="relative"
                                display="flex"
                                alignItems="flex-start"
                                justifyContent="flex-start"
                                pt={1}
                                pl={{base:1, md:2}}
                                fontSize={{base:'11px', md:'sm'}}
                                onMouseEnter={() => dateStr && setHoveredDate(dateStr)}
                                onMouseLeave={() => setHoveredDate(null)}
                                overflow="visible"
                                onClick={() => {
                                    if (!dateStr) return;

                                    setHoveredDate(null);

                                    setSelectedDate(prev =>
                                        prev === dateStr ? null : dateStr
                                    );
                                }}
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
                                        boxSize={{base:'22px', md:'35px'}}
                                        objectFit="contain"
                                    />
                                </Box>
                            )}
                                {(
                                        (!isMobile && hoveredDate === dateStr) ||
                                        selectedDate === dateStr
                                    ) && eventsByDate[dateStr] && (
                                    <Box
                                        position={isMobile ? 'fixed' : 'absolute'}
                                        display="block"
                                        top="50%"
                                        left={isMobile ? '50%' : undefined}
                                        right={!isMobile ? tooltipStyle.right : undefined}
                                        transform={
                                            isMobile
                                                ? 'translate(-50%, -50%)'
                                                : tooltipStyle.transform
                                        }
                                        // left="50%"
                                        // transform="translate(-50%, -120%)"
                                        {...(!isMobile && tooltipStyle)}
                                        bg="#34333C"
                                        color="white"
                                        p={{ base: 2, md: 3 }}
                                        borderRadius="xl"
                                        zIndex={20}
                                        w={{ base: '170px', md: '250px' }}
                                        boxShadow="xl" 
                                        textAlign="center"
                                    >
                                        {/* Дата */}
                                        <Text fontSize={{ base: '11px', md: '13px' }} mb={2} fontWeight="medium">
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
                                                        fontSize={{ base: '11px', md: '13px' }}
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
                                                            fontSize={{ base: '9px', md: '10px' }}
                                                            mb={1}
                                                        >
                                                            <Text fontSize="10px" cursor="pointer"
                                                                _hover={{
                                                                    textDecoration: 'underline'
                                                                }}
                                                                onClick={() => navigate(`/event/${event.event_id}`)}>
                                                                {event.title}
                                                            </Text>

                                                            <Text
                                                                fontSize={{ base: '9px', md: '10px' }}
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

                <Flex direction={{ base: 'column', md: 'row' }} gap={{base: 2, md: 4}} justify="space-between" align="center" mt={{base: 2, md: 6}}>
                    <Flex gap={3} wrap="wrap" align="center"
                            w="100%" justify={{base:'center', md:'flex-start'}}>
                        {/* Все события */}
                        <SelectRoot
                            width={{ base: '140px', md: '180px' }}
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
                                    fontSize={{ base: '11px', sm: "12px", md: 'sm' }}
                                    color="black"
                                    cursor="pointer"
                                >
                                    Все события
                                </Box>
                            </SelectTrigger>

                            <SelectContent borderRadius="xl" >
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
                            w={{base:'100%', md:'auto'}}
                            color="black"
                            borderRadius="full"
                            fontSize={{ base: '11px', sm: '12px', md: 'sm' }}
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
                                    {['', '0', '6', '12', '16', '18'].map(age => (
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
                                                {age ? `${age}+` : 'Все'}
                                            </Text>
                                        </Flex>
                                    ))}
                                </Flex>
                            </Box>
                        
                    </Box>
                    </Flex>

                    {/* 🔹 Правая часть — кнопки */}
                    <Flex gap={1} w="100%" justify={{ base: 'center', md: 'flex-end' }}>
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
                            <Image src={left} boxSize={{base:'32px', md:'40px'}} />
                        </Button>

                        <Button
                            onClick={handleNextMonth}
                            p={1}
                            borderRadius="full"
                            variant="ghost"
                            _hover={{ bg: "transparent" }}
                            _active={{ bg: "transparent" }}
                        >
                            <Image src={right} boxSize={{base:'32px', md:'40px'}} />
                        </Button>
                    </Flex>

                </Flex>
            </Box>
        </Modal>
    );
};

export default EventCalendarModal;