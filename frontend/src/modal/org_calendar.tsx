import React from "react";
import { Box, Grid, VStack, Text, Flex,
    useBreakpointValue } from "@chakra-ui/react";

const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const months = [
  "Январь", "Февраль", "Март", "Апрель",
  "Май", "Июнь", "Июль", "Август",
  "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];
const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];


// const testEvents = [
//   { date: "2026-01-12", title: "Спектакль Гамлет", time: "18:00" },
//   { date: "2026-01-12", title: "Балет Лебединое озеро", time: "20:00" },
//   { date: "2026-03-18", title: "Ревизор", time: "19:00" },
//   { date: "2026-07-01", title: "Концерт симфонический", time: "17:30" },
//   { date: "2026-12-05", title: "Щелкунчик", time: "18:00" }
// ];

const mockEvents = [
  {
    organization: 1,
    name: "	Экскурсия «Закулисье»",
    time_slots: [
      {
        date_event: "2026-06-24T00:00:00",
        start_time: "15:00:00",
      },
    ],
  },
  {
    organization: 1,
    name: "Капитанская дочка",
    time_slots: [
      {
        date_event: "2026-06-27T00:00:00",
        start_time: "18:00:00",
      },
    ],
  },
  {
    organization: 1,
    name: "Сны белой земли",
    time_slots: [
      {
        date_event: "2026-09-09T00:00:00",
        start_time: "18:00:00",
      },
    ],
  },
];
type Day = { value: number; isCurrentMonth: boolean };

// Генерация дней для месяца
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

type CalendarEvent = {
  date: string;
  title: string;
  time: string;
  organization?: number | string;
};

type Props = {
  events: any[]; // временно, потому что API сложный
};

export const Calendar: React.FC = () => {
  // const [hoveredDate, setHoveredDate] = React.useState<string | null>(null);
  const orgEvents = React.useMemo(() => {
  return mockEvents.filter(e => Number(e.organization) === 1);
}, []);

const calendarEvents = React.useMemo(() => {
  return mockEvents.flatMap(e =>
    (e.time_slots || []).map((slot: any) => ({
      date: slot.date_event.split("T")[0],
      title: e.name,
      time: slot.start_time.slice(0, 5),
    }))
  );
}, []);
const [isOpen, setIsOpen] = React.useState(false);
const [selectedEvents, setSelectedEvents] = React.useState<CalendarEvent[]>([]);
const [selectedDate, setSelectedDate] = React.useState('');

const [mobileMonth, setMobileMonth] = React.useState(0);
const prevMonth = () => {
    setMobileMonth(prev => prev === 0 ? 11 : prev - 1);
};

const nextMonth = () => {
    setMobileMonth(prev => prev === 11 ? 0 : prev + 1);
};
const isMobile = useBreakpointValue({
    base: true,
    md: false
});
    React.useEffect(() => {
      if (!selectedDate) return;

      const timer = setTimeout(() => {
        setSelectedDate('');
      }, 1500);

      return () => clearTimeout(timer);
    }, [selectedDate]);

const handleDayClick = (
    fullDate: string,
    events: CalendarEvent[]
) => {
    setSelectedDate(fullDate);
    setSelectedEvents(events);
    setIsOpen(true);
};

  const getEventsForDay = (day: Day, monthIndex: number) => {
    if (!day.isCurrentMonth) return [];

    const month = String(monthIndex + 1).padStart(2, "0");
    const date = String(day.value).padStart(2, "0");
    const fullDate = `2026-${month}-${date}`;

    return calendarEvents.filter(e => e.date === fullDate);
  };

  return (
    <Box bg="#6B84EA" w={{ base: "100%", md: "95%" }}
        py={{ base: 4, md: 7 }}
        px={{ base: 3, md: 0 }}
        borderRadius="20px"
        mt={{ md: 10, base: 5 }}
        ml="auto">
      <VStack gap={6} align="center">
        <Box bg="#A3B3F2" color="white" px={4} py={2} borderRadius="20px">
          <Text fontSize="xl" textAlign="center">2026 год</Text>
        </Box>
        <Grid templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)"
            }}
            gap={{ base: 4, md: 6 }}
            justifyItems="center">
          {Array.from({ length: 12 }).map((_, i) => (
            <Box
              key={i}
              bg="#A3B3F2"
              borderRadius="20px"
              p={{ base: 3, md: 4 }}
              color="white"
                w={{ base: "100%", md: "270px" }}
                maxW="270px"
                boxShadow="lg"
            >
              <Text fontWeight="bold" mb={2} textAlign="center" fontSize={{ base: "sm", md: "md" }}>
                {months[i]}
              </Text>
              <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
                {days.map(d => (
                  <Text key={d} fontSize={{ base: "10px", md: "xs" }} textAlign="center" opacity={0.8}>
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

                  return (
                    <Box key={idx} position="relative">
                      <Box
                        textAlign="center"
                        fontSize={{ base: "xs", md: "sm" }}
                        p={{ base: 0.5, md: 1 }}
                        borderRadius="6px"
                        bg={active ? "#6B84EA" : "transparent"}
                        onClick={() => {
                              if (!active) return;

                              setSelectedDate(prev =>
                                  prev === fullDate ? '' : fullDate
                              );
                          }}
                        color={
                          active
                            ? "white"
                            : day.isCurrentMonth
                            ? "white"
                            : "gray.400"
                        }
                        cursor={active ? "pointer" : "default"}
                        _hover={active ? { bg: "#4C6BE6" } : {}}
                        // onMouseEnter={() => active && setHoveredDate(fullDate)}
                        // onMouseLeave={() => setHoveredDate(null)}
                      >
                        {day.value}
                      </Box>

                      {/* Всплывающий блок с мероприятиями */}
                      {active && selectedDate === fullDate && (
                        
                        <Box
                          position="fixed"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                          bg="#4C6BE6"
                          color="white"
                          p={3}
                          borderRadius="10px"
                          w="250px"
                          zIndex={10}
                          boxShadow="lg"
                        >
                          
                          <Box position="relative" mb={2}>
                            <Text
                              textAlign="center"
                              fontWeight="bold"
                              fontSize="sm"
                            >
                              {fullDate.split("-").reverse().join(".")}
                            </Text>

                            <Text
                              position="absolute"
                              right="0"
                              top="50%"
                              transform="translateY(-50%)"
                              cursor="pointer"
                              onClick={() => setSelectedDate('')}
                            >
                              ✕
                            </Text>
                          </Box>
                          <VStack align="start" gap={2}>
                            {eventsForDay.map((event, idx) => (
                              <Box key={idx} w="100%">
                                <Flex justify="space-between" align="center" fontSize="sm">
                                  <Text fontWeight="medium">{event.title}</Text>
                                  <Text alignSelf="flex-start">{event.time}</Text>
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
  );
};
