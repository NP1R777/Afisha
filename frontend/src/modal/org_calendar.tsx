import React from "react";
import axios from "../shared/lib/axios";
import { Box, Button, Flex, Grid, HStack, Input, Spinner, Text, VStack } from "@chakra-ui/react";
import Modal from "react-modal";
import CreateModal from "../pages/creature";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель",
  "Май", "Июнь", "Июль", "Август",
  "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const EXACT_AGE_VALUES = ["", "0", "6", "12", "16", "18"];

type Day = { value: number; isCurrentMonth: boolean };

type CalendarEventItem = {
  slot_id: number;
  event_id: number;
  date: string;
  time: string;
  title: string;
  age_limit?: string | null;
  organizer?: string | null;
  is_organizer_event?: boolean;
};

type CalendarEventsResponse = {
  total: number;
  items: CalendarEventItem[];
};

interface CalendarProps {
  organizerName?: string;
  canManageEvents?: boolean;
}

function toDateString(year: number, monthIndex: number, day: number): string {
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function generateDaysForMonth(year: number, monthIndex: number): Day[] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysArray: Day[] = [];
  const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
  const prevMonthYear = monthIndex === 0 ? year - 1 : year;
  const prevMonthDays = new Date(prevMonthYear, prevMonthIndex + 1, 0).getDate();

  for (let index = startDay - 1; index >= 0; index -= 1) {
    daysArray.push({ value: prevMonthDays - index, isCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    daysArray.push({ value: day, isCurrentMonth: true });
  }
  let nextMonthDay = 1;
  while (daysArray.length < 42) {
    daysArray.push({ value: nextMonthDay, isCurrentMonth: false });
    nextMonthDay += 1;
  }
  return daysArray;
}

function normalizeText(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export const Calendar: React.FC<CalendarProps> = ({ organizerName, canManageEvents = false }) => {
  const currentYear = new Date().getFullYear();
  const [dateFrom, setDateFrom] = React.useState(`${currentYear}-01-01`);
  const [dateTo, setDateTo] = React.useState(`${currentYear}-12-31`);
  const [selectedAge, setSelectedAge] = React.useState("");
  const [selectedDateForModal, setSelectedDateForModal] = React.useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [events, setEvents] = React.useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const displayYear = React.useMemo(() => {
    const parsed = Number(dateFrom.split("-")[0]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : currentYear;
  }, [currentYear, dateFrom]);

  const organizerKey = React.useMemo(() => normalizeText(organizerName), [organizerName]);

  React.useEffect(() => {
    let isCancelled = false;

    const loadEvents = async () => {
      if (!dateFrom || !dateTo) {
        setError("Выбери диапазон дат для загрузки календаря.");
        setEvents([]);
        return;
      }
      if (dateFrom > dateTo) {
        setError("Дата начала не может быть больше даты окончания.");
        setEvents([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("date_from", dateFrom);
        params.set("date_to", dateTo);
        if (selectedAge) {
          params.set("age_values", selectedAge);
        }
        if (organizerName?.trim()) {
          params.set("organizer_name", organizerName.trim());
        }

        const response = await axios.get(`/event/calendar/events?${params.toString()}`);
        const payload = (response.data || {}) as CalendarEventsResponse;
        const items = Array.isArray(payload.items) ? payload.items : [];
        if (!isCancelled) {
          setEvents(items);
        }
      } catch (err: any) {
        if (isCancelled) {
          return;
        }
        const detail = err?.response?.data?.detail;
        setError(typeof detail === "string" ? detail : err?.message || "Не удалось загрузить календарь.");
        setEvents([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void loadEvents();
    return () => {
      isCancelled = true;
    };
  }, [dateFrom, dateTo, selectedAge, organizerName, refreshToken]);

  const eventsByDate = React.useMemo(() => {
    const grouped: Record<string, CalendarEventItem[]> = {};
    for (const item of events) {
      if (!item.date) {
        continue;
      }
      if (!grouped[item.date]) {
        grouped[item.date] = [];
      }
      grouped[item.date].push(item);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((left, right) => {
        if (left.time !== right.time) {
          return left.time.localeCompare(right.time);
        }
        return left.title.localeCompare(right.title);
      });
    }
    return grouped;
  }, [events]);

  const resetFilters = () => {
    setDateFrom(`${displayYear}-01-01`);
    setDateTo(`${displayYear}-12-31`);
    setSelectedAge("");
  };

  const selectedDayEvents = selectedDateForModal ? (eventsByDate[selectedDateForModal] || []) : [];
  const isDateModalOpen = selectedDateForModal !== null;

  const handleDayClick = (day: Day, monthIndex: number) => {
    if (!canManageEvents || !day.isCurrentMonth) {
      return;
    }
    const clickedDate = toDateString(displayYear, monthIndex, day.value);
    setSelectedDateForModal(clickedDate);
  };

  const closeDateModal = () => {
    setSelectedDateForModal(null);
  };

  const handleOpenCreateEvent = () => {
    closeDateModal();
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setRefreshToken((value) => value + 1);
  };

  return (
    <Box bg="#6B84EA" w="95%" py={7} borderRadius="20px" mt={10} ml="auto">
      <VStack gap={4} align="center">
        <Box bg="#A3B3F2" color="white" px={4} py={2} borderRadius="20px">
          <Text fontSize="xl" textAlign="center">{displayYear} год</Text>
        </Box>

        <HStack
          w="100%"
          justify="center"
          gap={2}
          flexWrap="wrap"
          px={4}
        >
          <Input
            type="date"
            maxW="180px"
            bg="white"
            color="black"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
          <Text color="white" fontWeight="600">—</Text>
          <Input
            type="date"
            maxW="180px"
            bg="white"
            color="black"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
          <select
            value={selectedAge}
            onChange={(event) => setSelectedAge(event.target.value)}
            style={{
              background: "white",
              color: "black",
              borderRadius: "6px",
              height: "40px",
              minWidth: "160px",
              padding: "0 8px",
            }}
          >
            <option value="">Все возраста</option>
            {EXACT_AGE_VALUES.filter(Boolean).map((value) => (
              <option key={value} value={value}>
                {value}+
              </option>
            ))}
          </select>
          <Button bg="#4C6BE6" color="white" onClick={resetFilters}>
            Сбросить
          </Button>
          {loading ? <Spinner color="white" size="sm" /> : null}
        </HStack>

        {error ? (
          <Box bg="rgba(255, 93, 93, 0.2)" borderRadius="10px" px={3} py={2}>
            <Text color="#ffe1e1" fontSize="sm">{error}</Text>
          </Box>
        ) : null}

        {!canManageEvents ? (
          <Box bg="rgba(255, 255, 255, 0.22)" borderRadius="10px" px={3} py={2}>
            <Text color="white" fontSize="sm">
              Просмотр календаря доступен всем, но открывать дату и создавать мероприятия может только роль организатора.
            </Text>
          </Box>
        ) : null}

        <HStack color="white" gap={4} fontSize="xs">
          <HStack gap={1}>
            <Box w="10px" h="10px" borderRadius="full" bg="#6B84EA" />
            <Text>События</Text>
          </HStack>
          <HStack gap={1}>
            <Box w="10px" h="10px" borderRadius="full" bg="#2D4DDB" />
            <Text>События организатора</Text>
          </HStack>
        </HStack>

        <Grid templateColumns="repeat(4, 1fr)" gap={6}>
          {Array.from({ length: 12 }).map((_, monthIndex) => (
            <Box
              key={monthIndex}
              bg="#A3B3F2"
              borderRadius="20px"
              p={4}
              color="white"
              w="270px"
              boxShadow="lg"
            >
              <Text fontWeight="bold" mb={2} textAlign="center">
                {MONTHS[monthIndex]}
              </Text>
              <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
                {DAYS.map((day) => (
                  <Text key={day} fontSize="xs" textAlign="center" opacity={0.8}>
                    {day}
                  </Text>
                ))}
              </Grid>
              <Grid templateColumns="repeat(7, 1fr)" gap={1}>
                {generateDaysForMonth(displayYear, monthIndex).map((day, index) => {
                  const fullDate = day.isCurrentMonth
                    ? toDateString(displayYear, monthIndex, day.value)
                    : "";
                  const eventsForDay = fullDate ? eventsByDate[fullDate] || [] : [];
                  const hasEvents = eventsForDay.length > 0;
                  const hasOrganizerEvent = eventsForDay.some((item) => {
                    if (item.is_organizer_event) {
                      return true;
                    }
                    return organizerKey.length > 0 && normalizeText(item.organizer) === organizerKey;
                  });

                  return (
                    <Box key={`${monthIndex}-${index}`} position="relative">
                      <Box
                        textAlign="center"
                        fontSize="sm"
                        p={1}
                        borderRadius="6px"
                        bg={hasEvents ? (hasOrganizerEvent ? "#2D4DDB" : "#6B84EA") : "transparent"}
                        color={day.isCurrentMonth ? "white" : "gray.400"}
                        cursor={canManageEvents && day.isCurrentMonth ? "pointer" : "default"}
                        _hover={hasEvents ? { bg: hasOrganizerEvent ? "#20379D" : "#4C6BE6" } : {}}
                        onClick={() => handleDayClick(day, monthIndex)}
                      >
                        {day.value}
                      </Box>
                    </Box>
                  );
                })}
              </Grid>
            </Box>
          ))}
        </Grid>
      </VStack>

      <Modal
        isOpen={isDateModalOpen}
        onRequestClose={closeDateModal}
        contentLabel="События выбранной даты"
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            zIndex: 1200,
          },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            border: "none",
            borderRadius: "16px",
            padding: "0",
            background: "transparent",
            maxWidth: "680px",
            width: "92%",
          },
        }}
      >
        <Box bg="#1E2B73" p={4} borderRadius="16px" border="1px solid rgba(255,255,255,0.22)">
          <Flex justify="space-between" align="center" mb={3}>
            <Text color="white" fontWeight="700" fontSize="20px">
              {selectedDateForModal ? selectedDateForModal.split("-").reverse().join(".") : "Выбранная дата"}
            </Text>
            <Button
              size="sm"
              bg="transparent"
              color="white"
              _hover={{ bg: "rgba(255,255,255,0.15)" }}
              onClick={closeDateModal}
            >
              Закрыть
            </Button>
          </Flex>

          {selectedDayEvents.length > 0 ? (
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3} mb={4}>
              {selectedDayEvents.map((eventItem) => {
                const isOrganizerEvent = eventItem.is_organizer_event || (
                  organizerKey.length > 0 && normalizeText(eventItem.organizer) === organizerKey
                );
                return (
                  <Box
                    key={eventItem.slot_id}
                    bg="rgba(255,255,255,0.16)"
                    border={isOrganizerEvent ? "1px solid rgba(120, 175, 255, 0.85)" : "1px solid rgba(255,255,255,0.22)"}
                    borderRadius="12px"
                    p={3}
                  >
                    <Text
                      color="white"
                      fontWeight="700"
                      fontSize="14px"
                      style={{
                        display: "-webkit-box",
                        overflow: "hidden",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                      }}
                    >
                      {eventItem.title}
                    </Text>
                    <Text color="#DCE9FF" fontSize="12px" mt={1}>
                      Время: {eventItem.time}
                    </Text>
                    <Text color="#DCE9FF" fontSize="12px">
                      Организатор: {eventItem.organizer || "не указан"}
                    </Text>
                    {isOrganizerEvent ? (
                      <Box mt={2} display="inline-block" bg="#2D4DDB" borderRadius="full" px={2} py={0.5}>
                        <Text color="white" fontSize="10px">Ваше событие</Text>
                      </Box>
                    ) : null}
                  </Box>
                );
              })}
            </Grid>
          ) : null}

          <Flex justify="center">
            <Button
              bg="#4C6BE6"
              color="white"
              onClick={handleOpenCreateEvent}
            >
              Создать мероприятие
            </Button>
          </Flex>
        </Box>
      </Modal>

      <CreateModal
        isOpen={isCreateModalOpen}
        onRequestClose={() => setIsCreateModalOpen(false)}
        onCreateSuccess={handleCreateSuccess}
      />
    </Box>
  );
};