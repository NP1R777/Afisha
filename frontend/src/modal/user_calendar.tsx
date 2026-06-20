// import React from 'react';
// import { Box, Button, Flex, Grid, HStack, Image, Input, Spinner, Text } from '@chakra-ui/react';
// import Modal from 'react-modal';
// import { useNavigate } from 'react-router-dom';
// import axios from '../shared/lib/axios';
// import cloud from '../pictures/cloud.png';
// import cloud2 from '../pictures/cloud2.png';
// import left from '../pictures/lev1.png';
// import right from '../pictures/prav1.png';
// import tickets from '../pictures/tickets.png';

// interface Props {
//   isOpen: boolean;
//   onClose: () => void;
// }

// type CalendarEventItem = {
//   slot_id: number;
//   event_id: number;
//   date: string;
//   time: string;
//   title: string;
//   age_limit?: string | null;
//   organizer?: string | null;
// };

// type CalendarEventsResponse = {
//   total: number;
//   items: CalendarEventItem[];
// };

// type CalendarDay = {
//   day: number;
//   type: 'prev' | 'current' | 'next';
// };

// const AGE_VALUES = ['', '0', '6', '12', '16', '18'];

// function toDateString(year: number, month: number, day: number): string {
//   const normalizedMonth = String(month + 1).padStart(2, '0');
//   const normalizedDay = String(day).padStart(2, '0');
//   return `${year}-${normalizedMonth}-${normalizedDay}`;
// }

// function formatDisplayDate(dateString: string): string {
//   const [year, month, day] = dateString.split('-');
//   return `${day}.${month}.${year}`;
// }

// function getMonthBounds(date: Date): { from: string; to: string } {
//   const year = date.getFullYear();
//   const month = date.getMonth();
//   const firstDay = toDateString(year, month, 1);
//   const lastDay = toDateString(year, month, new Date(year, month + 1, 0).getDate());
//   return { from: firstDay, to: lastDay };
// }

// function getCalendarDays(date: Date): CalendarDay[] {
//   const year = date.getFullYear();
//   const month = date.getMonth();
//   const firstDayOfMonth = new Date(year, month, 1);
//   const startDay = (firstDayOfMonth.getDay() + 6) % 7;
//   const daysInMonth = new Date(year, month + 1, 0).getDate();
//   const daysInPrevMonth = new Date(year, month, 0).getDate();
//   const days: CalendarDay[] = [];

//   for (let index = startDay - 1; index >= 0; index -= 1) {
//     days.push({ day: daysInPrevMonth - index, type: 'prev' });
//   }

//   for (let day = 1; day <= daysInMonth; day += 1) {
//     days.push({ day, type: 'current' });
//   }

//   while (days.length < 42) {
//     days.push({ day: days.length - daysInMonth - startDay + 1, type: 'next' });
//   }

//   return days;
// }

// const UserCalendarModal = ({ isOpen, onClose }: Props) => {
//   const navigate = useNavigate();
//   const initialMonth = React.useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), []);
//   const initialBounds = React.useMemo(() => getMonthBounds(initialMonth), [initialMonth]);

//   const [currentDate, setCurrentDate] = React.useState(initialMonth);
//   const [dateFrom, setDateFrom] = React.useState(initialBounds.from);
//   const [dateTo, setDateTo] = React.useState(initialBounds.to);
//   const [selectedAge, setSelectedAge] = React.useState('');
//   const [hoveredDate, setHoveredDate] = React.useState<string | null>(null);
//   const [selectedDateForModal, setSelectedDateForModal] = React.useState<string | null>(null);
//   const [events, setEvents] = React.useState<CalendarEventItem[]>([]);
//   const [loading, setLoading] = React.useState(false);
//   const [error, setError] = React.useState<string | null>(null);

//   const syncMonthRange = React.useCallback((nextMonth: Date) => {
//     const bounds = getMonthBounds(nextMonth);
//     setDateFrom(bounds.from);
//     setDateTo(bounds.to);
//   }, []);

//   React.useEffect(() => {
//     if (!isOpen) {
//       return;
//     }
//     let isCancelled = false;

//     const loadEvents = async () => {
//       if (!dateFrom || !dateTo) {
//         setEvents([]);
//         setError('Выберите даты начала и окончания.');
//         return;
//       }
//       if (dateFrom > dateTo) {
//         setEvents([]);
//         setError('Дата начала не может быть больше даты окончания.');
//         return;
//       }

//       setLoading(true);
//       setError(null);
//       try {
//         const params = new URLSearchParams();
//         params.set('date_from', dateFrom);
//         params.set('date_to', dateTo);
//         if (selectedAge) {
//           params.set('age_values', selectedAge);
//         }

//         const response = await axios.get(`/event/calendar/events?${params.toString()}`);
//         const payload = (response.data || {}) as CalendarEventsResponse;
//         const items = Array.isArray(payload.items) ? payload.items : [];
//         items.sort((left, right) => {
//           if (left.date !== right.date) {
//             return left.date.localeCompare(right.date);
//           }
//           if (left.time !== right.time) {
//             return left.time.localeCompare(right.time);
//           }
//           return left.title.localeCompare(right.title);
//         });
//         if (!isCancelled) {
//           setEvents(items);
//         }
//       } catch (err: any) {
//         if (isCancelled) {
//           return;
//         }
//         const detail = err?.response?.data?.detail;
//         setEvents([]);
//         setError(typeof detail === 'string' ? detail : (err?.message || 'Не удалось загрузить события календаря.'));
//       } finally {
//         if (!isCancelled) {
//           setLoading(false);
//         }
//       }
//     };

//     void loadEvents();
//     return () => {
//       isCancelled = true;
//     };
//   }, [dateFrom, dateTo, isOpen, selectedAge]);

//   const eventsByDate = React.useMemo(() => {
//     const grouped: Record<string, CalendarEventItem[]> = {};
//     for (const event of events) {
//       if (!grouped[event.date]) {
//         grouped[event.date] = [];
//       }
//       grouped[event.date].push(event);
//     }
//     return grouped;
//   }, [events]);

//   const selectedDayEvents = selectedDateForModal ? eventsByDate[selectedDateForModal] || [] : [];
//   const isDayModalOpen = selectedDateForModal !== null;
//   const days = React.useMemo(() => getCalendarDays(currentDate), [currentDate]);

//   const handlePrevMonth = () => {
//     const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
//     setCurrentDate(previousMonth);
//     syncMonthRange(previousMonth);
//   };

//   const handleNextMonth = () => {
//     const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
//     setCurrentDate(nextMonth);
//     syncMonthRange(nextMonth);
//   };

//   const handleDateFromChange = (value: string) => {
//     setDateFrom(value);
//     if (!value) {
//       return;
//     }
//     const parsedDate = new Date(value);
//     if (!Number.isNaN(parsedDate.getTime())) {
//       setCurrentDate(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
//     }
//   };

//   const handleDayClick = (dateString: string, hasEvents: boolean) => {
//     if (!hasEvents) {
//       return;
//     }
//     setSelectedDateForModal(dateString);
//   };

//   const groupedByOrganizer = (items: CalendarEventItem[]) => {
//     return items.reduce((accumulator, item) => {
//       const organizer = item.organizer || 'Организатор не указан';
//       if (!accumulator[organizer]) {
//         accumulator[organizer] = [];
//       }
//       accumulator[organizer].push(item);
//       return accumulator;
//     }, {} as Record<string, CalendarEventItem[]>);
//   };

//   const monthTitle = currentDate
//     .toLocaleString('ru-RU', { month: 'long', year: 'numeric' })
//     .replace(' г.', '')
//     .replace(/^./, (letter) => letter.toUpperCase());

//   return (
//     <>
//       <Modal
//         isOpen={isOpen}
//         onRequestClose={onClose}
//         style={{
//           overlay: {
//             backgroundColor: 'rgba(0,0,0,0.6)',
//             zIndex: 1000,
//           },
//           content: {
//             inset: '50% auto auto 50%',
//             transform: 'translate(-50%, -50%)',
//             padding: 0,
//             border: 'none',
//             borderRadius: '20px',
//             maxWidth: '760px',
//             width: '92%',
//             background: '#22212C',
//           },
//         }}
//       >
//         <Box p={5} color="white" fontFamily="Unbounded">
//           <Flex justify="center" align="center" mb={2} gap={12}>
//             <Image src={cloud2} alt="decor-left" boxSize="80px" objectFit="contain" />
//             <Text fontSize="30px" fontWeight="bold" textAlign="center">
//               Календарь событий
//             </Text>
//             <Image src={cloud} alt="decor-right" boxSize="80px" objectFit="contain" />
//           </Flex>

//           <HStack mb={3} gap={2} flexWrap="wrap" justify="center">
//           <Input
//             type="date"
//             bg="white"
//             color="black"
//             value={dateFrom}
//             onChange={(event) => handleDateFromChange(event.target.value)}
//             maxW="170px"
//           />
//           <Text>—</Text>
//           <Input
//             type="date"
//             bg="white"
//             color="black"
//             value={dateTo}
//             onChange={(event) => setDateTo(event.target.value)}
//             maxW="170px"
//           />
//           <select
//             value={selectedAge}
//             onChange={(event) => setSelectedAge(event.target.value)}
//             style={{
//               background: 'white',
//               color: 'black',
//               borderRadius: '9999px',
//               height: '40px',
//               minWidth: '130px',
//               padding: '0 12px',
//             }}
//           >
//             <option value="">Возраст</option>
//             {AGE_VALUES.filter(Boolean).map((value) => (
//               <option key={value} value={value}>
//                 {value}+
//               </option>
//             ))}
//           </select>
//           <Button
//             bg="white"
//             color="black"
//             borderRadius="full"
//             onClick={() => {
//               setSelectedAge('');
//               syncMonthRange(currentDate);
//             }}
//           >
//             Сбросить
//           </Button>
//           {loading ? <Spinner size="sm" color="white" /> : null}
//           </HStack>

//           {error ? (
//             <Box mb={3} bg="rgba(255, 93, 93, 0.2)" borderRadius="10px" px={3} py={2}>
//               <Text color="#ffe1e1" fontSize="sm">
//                 {error}
//               </Text>
//             </Box>
//           ) : null}

//           <Box bg="white" borderRadius="xl" p={4} color="black" fontWeight="medium">
//             <Text textAlign="center" mb={3} fontSize="20px">
//               {monthTitle}
//             </Text>

//             <Grid templateColumns="repeat(7, 1fr)" gap={2} mb={2}>
//               {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map((day) => (
//                 <Text key={day} textAlign="center" fontSize="sm">
//                   {day}
//                 </Text>
//               ))}
//             </Grid>

//             <Grid templateColumns="repeat(7, 1fr)" gap={2} overflow="visible">
//               {days.map((item, index) => {
//               const dateStr =
//                 item.type === 'current'
//                   ? toDateString(currentDate.getFullYear(), currentDate.getMonth(), item.day)
//                   : '';
//               const eventsForDay = dateStr ? eventsByDate[dateStr] || [] : [];
//               const hasEvents = eventsForDay.length > 0;
//               const groupedEvents = groupedByOrganizer(eventsForDay);
//               const tooltipOffset =
//                 index % 7 === 0
//                   ? { left: '0', transform: 'translateY(-120%)' }
//                   : index % 7 === 6
//                     ? { right: '0', transform: 'translateY(-120%)' }
//                     : { left: '50%', transform: 'translate(-50%, -120%)' };

//                 return (
//                   <Box
//                     key={`${item.type}-${item.day}-${index}`}
//                     height="60px"
//                     borderRadius="md"
//                     bg={
//                       item.type !== 'current'
//                         ? '#EAEAEA'
//                         : hasEvents
//                           ? eventsForDay.length > 3
//                             ? '#000E47'
//                             : eventsForDay.length > 1
//                               ? '#0021A6'
//                               : '#b77423'
//                           : '#C9D4FF'
//                     }
//                     color={item.type === 'current' ? 'white' : 'gray.500'}
//                     position="relative"
//                     display="flex"
//                     alignItems="flex-start"
//                     justifyContent="flex-start"
//                     pt={1}
//                     pl={2}
//                     fontSize="sm"
//                     cursor={hasEvents ? 'pointer' : 'default'}
//                     onMouseEnter={() => dateStr && setHoveredDate(dateStr)}
//                     onMouseLeave={() => setHoveredDate(null)}
//                     onClick={() => dateStr && handleDayClick(dateStr, hasEvents)}
//                     overflow="visible"
//                   >
//                     {item.day}
//                     {hasEvents ? (
//                       <Box position="absolute" bottom="-2px" right="4px">
//                         <Image src={tickets} alt="events-count" boxSize="35px" objectFit="contain" />
//                       </Box>
//                     ) : null}

//                     {hoveredDate === dateStr && hasEvents ? (
//                       <Box
//                         position="absolute"
//                         top="50%"
//                         {...tooltipOffset}
//                         bg="#34333C"
//                         color="white"
//                         p={3}
//                         borderRadius="xl"
//                         zIndex={20}
//                         w="270px"
//                         boxShadow="xl"
//                         textAlign="center"
//                       >
//                         <Text fontSize="13px" mb={2} fontWeight="medium">
//                           {formatDisplayDate(dateStr)}
//                         </Text>

//                         <Box bg="white" color="black" borderRadius="lg" p={2} textAlign="left">
//                           {Object.entries(groupedEvents).map(([organizer, organizerEvents]) => (
//                             <Box key={organizer} mb={2}>
//                               <Text fontWeight="bold" fontSize="12px" mb={1}>
//                                 {organizer}
//                               </Text>
//                               {organizerEvents.map((eventItem) => (
//                                 <Flex
//                                   key={eventItem.slot_id}
//                                   justify="space-between"
//                                   align="center"
//                                   fontSize="10px"
//                                   mb={1}
//                                   gap={2}
//                                 >
//                                   <Text
//                                     style={{
//                                       display: '-webkit-box',
//                                       overflow: 'hidden',
//                                       WebkitBoxOrient: 'vertical',
//                                       WebkitLineClamp: 2,
//                                     }}
//                                   >
//                                     {eventItem.title}
//                                   </Text>
//                                   <Text whiteSpace="nowrap">{eventItem.time}</Text>
//                                 </Flex>
//                               ))}
//                             </Box>
//                           ))}
//                         </Box>
//                       </Box>
//                     ) : null}
//                   </Box>
//                 );
//               })}
//             </Grid>
//           </Box>

//           <Flex justify="space-between" align="center" mt={4}>
//             <Text color="white" fontSize="sm">
//               Показаны все события сайта
//             </Text>
//             <Flex gap={2}>
//               <Button
//                 onClick={handlePrevMonth}
//                 p={1}
//                 borderRadius="full"
//                 variant="ghost"
//                 _hover={{ bg: 'transparent' }}
//                 _active={{ bg: 'transparent' }}
//               >
//                 <Image src={left} boxSize="40px" />
//               </Button>
//               <Button
//                 onClick={handleNextMonth}
//                 p={1}
//                 borderRadius="full"
//                 variant="ghost"
//                 _hover={{ bg: 'transparent' }}
//                 _active={{ bg: 'transparent' }}
//               >
//                 <Image src={right} boxSize="40px" />
//               </Button>
//             </Flex>
//           </Flex>
//         </Box>
//       </Modal>

//       <Modal
//         isOpen={isDayModalOpen}
//         onRequestClose={() => setSelectedDateForModal(null)}
//         style={{
//           overlay: {
//             backgroundColor: 'rgba(0,0,0,0.65)',
//             zIndex: 1300,
//           },
//           content: {
//             inset: '50% auto auto 50%',
//             transform: 'translate(-50%, -50%)',
//             padding: 0,
//             border: 'none',
//             borderRadius: '16px',
//             maxWidth: '700px',
//             width: '90%',
//             background: '#1E2B73',
//           },
//         }}
//       >
//         <Box p={4} color="white" fontFamily="Unbounded">
//           <Flex justify="space-between" align="center" mb={3}>
//             <Text fontSize="20px" fontWeight="700">
//               {selectedDateForModal ? formatDisplayDate(selectedDateForModal) : 'Выбранная дата'}
//             </Text>
//             <Button
//               size="sm"
//               bg="transparent"
//               color="white"
//               _hover={{ bg: 'rgba(255,255,255,0.15)' }}
//               onClick={() => setSelectedDateForModal(null)}
//             >
//               Закрыть
//             </Button>
//           </Flex>

//           {selectedDayEvents.length > 0 ? (
//             <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
//               {selectedDayEvents.map((eventItem) => (
//                 <Box
//                   key={eventItem.slot_id}
//                   bg="rgba(255,255,255,0.16)"
//                   border="1px solid rgba(255,255,255,0.25)"
//                   borderRadius="12px"
//                   p={3}
//                   cursor="pointer"
//                   _hover={{ bg: 'rgba(255,255,255,0.24)' }}
//                   onClick={() => {
//                     setSelectedDateForModal(null);
//                     onClose();
//                     navigate(`/event/${eventItem.event_id}`);
//                   }}
//                 >
//                   <Text
//                     color="white"
//                     fontWeight="700"
//                     fontSize="14px"
//                     style={{
//                       display: '-webkit-box',
//                       overflow: 'hidden',
//                       WebkitBoxOrient: 'vertical',
//                       WebkitLineClamp: 2,
//                     }}
//                   >
//                     {eventItem.title}
//                   </Text>
//                   <Text color="#DCE9FF" fontSize="12px" mt={1}>
//                     Время: {eventItem.time}
//                   </Text>
//                   <Text color="#DCE9FF" fontSize="12px">
//                     Возраст: {eventItem.age_limit || 'не указан'}
//                   </Text>
//                   <Text color="#DCE9FF" fontSize="12px">
//                     Организатор: {eventItem.organizer || 'не указан'}
//                   </Text>
//                 </Box>
//               ))}
//             </Grid>
//           ) : (
//             <Box bg="rgba(255,255,255,0.14)" borderRadius="12px" p={3}>
//               <Text color="white">На выбранную дату пока нет мероприятий.</Text>
//             </Box>
//           )}
//         </Box>
//       </Modal>
//     </>
//   );
// };

// export default UserCalendarModal;
