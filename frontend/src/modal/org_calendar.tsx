import React from "react";
import { Box, Grid, VStack, Text, Flex } from "@chakra-ui/react";

const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const months = [
  "Январь", "Февраль", "Март", "Апрель",
  "Май", "Июнь", "Июль", "Август",
  "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];
const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Тестовые мероприятия (можно позже вынести в пропсы)
const testEvents = [
  { date: "2026-01-12", title: "Спектакль Гамлет", time: "18:00" },
  { date: "2026-01-12", title: "Балет Лебединое озеро", time: "20:00" },
  { date: "2026-03-18", title: "Ревизор", time: "19:00" },
  { date: "2026-07-01", title: "Концерт симфонический", time: "17:30" },
  { date: "2026-12-05", title: "Щелкунчик", time: "18:00" }
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

// Получение событий для конкретного дня
function getEventsForDay(day: Day, monthIndex: number) {
  if (!day.isCurrentMonth) return [];
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day.value).padStart(2, "0");
  const fullDate = `2026-${month}-${date}`;
  return testEvents.filter(e => e.date === fullDate);
}

export const Calendar: React.FC = () => {
  const [hoveredDate, setHoveredDate] = React.useState<string | null>(null);

  return (
    <Box bg="#6B84EA" w="95%" py={7} borderRadius="20px" mt={10} ml="auto">
      <VStack gap={6} align="center">
        <Box bg="#A3B3F2" color="white" px={4} py={2} borderRadius="20px">
          <Text fontSize="xl" textAlign="center">2026 год</Text>
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
                {days.map(d => (
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

                  return (
                    <Box key={idx} position="relative">
                      <Box
                        textAlign="center"
                        fontSize="sm"
                        p={1}
                        borderRadius="6px"
                        bg={active ? "#6B84EA" : "transparent"}
                        color={
                          active
                            ? "white"
                            : day.isCurrentMonth
                            ? "white"
                            : "gray.400"
                        }
                        cursor={active ? "pointer" : "default"}
                        _hover={active ? { bg: "#4C6BE6" } : {}}
                        onMouseEnter={() => active && setHoveredDate(fullDate)}
                        onMouseLeave={() => setHoveredDate(null)}
                      >
                        {day.value}
                      </Box>

                      {/* Всплывающий блок с мероприятиями */}
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
                          <Text textAlign="center" fontWeight="bold" fontSize="sm" mb={2}>
                            {fullDate.split("-").reverse().join(".")}
                          </Text>
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