import { Box, Button, createListCollection, Flex, Grid, Heading, HStack, Image, Text, useMediaQuery, VStack} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FormEvent, useEffect, useState, useRef  } from 'react';
import { useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import Modal from 'react-modal';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../addition/context';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger } from '../components/ui/select';
import LoginModal from '../pages/authorization';
import RegisterModal from '../pages/registration';
import box from '../pictures/box.png';
import position from '../pictures/position.png';
import ticket from '../pictures/ticket.png';
import wave from '../pictures/wave31.png';
import axios from '../shared/lib/axios';
import { ContainerFluid } from '../components/ui/container';
import cross from '../pictures/cross.png';
import EventImage from '../pictures/picture.png';
import EventCalendarModal from '../modal/calendar';


interface Event {
  id?: number;
  external_url: string;
  name: string;
  description: string;
  organization: string;
  group_id: number;
  time_slots: {
    id: number;
    date_event: string;
    start_time: string;
    event_id: number;
  }[];
  duration: string;
  price: string;
  address: string;
  city: string;
  age_limit: string;
  pictures_main: string;
  pictures_two: string | null;
}

function sanitizeImageCandidate(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }
  const lowered = normalized.toLowerCase();
  if (lowered === 'null' || lowered === 'none' || lowered === 'undefined' || lowered === '[object object]') {
    return '';
  }
  return normalized;
}

function extractImageFromStructuredString(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const directHttp = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
  if (directHttp?.[0]) {
    return directHttp[0];
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const normalizedArrayString = trimmed.replace(/'/g, '"');
    try {
      const parsed = JSON.parse(normalizedArrayString);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          const nested = extractImageFromStructuredString(String(entry));
          if (nested) {
            return nested;
          }
        }
      }
    } catch {
      // ignore malformed arrays
    }
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const normalizedObjectString = trimmed.replace(/'/g, '"');
    try {
      const parsed = JSON.parse(normalizedObjectString) as Record<string, unknown>;
      const objectCandidates = [parsed.url, parsed.src, parsed.picture_url, parsed.pictures_main];
      for (const candidate of objectCandidates) {
        const nested = extractImageFromStructuredString(String(candidate ?? ''));
        if (nested) {
          return nested;
        }
      }
    } catch {
      // ignore malformed objects
    }
  }

  const splitCandidates = trimmed
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const candidate of splitCandidates) {
    if (candidate.startsWith('https://') || candidate.startsWith('http://')) {
      return candidate;
    }
    if (candidate.startsWith('//')) {
      return `https:${candidate}`;
    }
    if (candidate.startsWith('/')) {
      return candidate;
    }
  }

  return '';
}

function resolveEventImage(item: any): string {
  const candidates = [
    item?.pictures_main,
    item?.picture_url,
    item?.pictures_url,
    item?.horizontal_picture_url,
    item?.pictures_two,
  ];

  for (const candidate of candidates) {
    const normalized = sanitizeImageCandidate(candidate);
    if (!normalized) {
      continue;
    }
    const extracted = extractImageFromStructuredString(normalized);
    if (extracted) {
      return extracted;
    }
  }
  return EventImage;
}

function normalizeEvent(item: any): Event {
  const normalizedTimeSlots = Array.isArray(item?.time_slots) ? item.time_slots : [];
  const groupId = item?.group_links?.[0]?.groups_id ?? 0;

  return {
    id: item?.id ? Number(item.id) : undefined,
    external_url: item?.external_url || '',
    name: item?.name || '',
    description: item?.description || '',
    organization: item?.organization || '',
    group_id: Number(groupId),
    time_slots: normalizedTimeSlots,
    duration: item?.duration || '',
    price:
      item?.price !== null && item?.price !== undefined
        ? String(item.price)
        : '',
    address: item?.address || '',
    city: item?.city || '',
    age_limit: item?.age_limit || '',
    pictures_main: resolveEventImage(item),
    pictures_two:
      item?.horizontal_picture_url ||
      item?.pictures_two ||
      null,
  };
}

interface EventCategory {
  id: number;
  name: string;
  description: string;
  created_at: string;
  update_at: string;
  event_id: number | null;
  deleted_at: string | null;
}

const Frame = () => {
  const {
    userId,
    categories: userCategories,
    setUsername,
    searchQuery,
    isAuthenticated,
    role
  } = useUser();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [categoriesFromBackend, setCategoriesFromBackend] = useState<EventCategory[]>([]);
  const [eventsByCategory, setEventsByCategory] = useState<Record<number, Event[]>>({});
  const [categoryIndexes, setCategoryIndexes] = useState<Record<number, number>>({});
  // const [formattedDate, setFormattedDate] = useState<string | null>(null);
  // const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [previousSearchQuery, setPreviousSearchQuery] = useState('');
  const navigate = useNavigate();
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false); //для календаря
  const [personalizedIndex, setPersonalizedIndex] = useState(0);
  const [isMd, isXl] = useMediaQuery(['(min-width: 768px)', '(min-width: 1280px)'], {
    fallback: [false, false, true],
  });
  const eventsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const categoriesRef = useRef<HTMLDivElement | null>(null);
  const safeUserCategories = userCategories ?? [];
  const userCategoriesStr = safeUserCategories.map(String);

  useEffect(() => {
    if (!searchQuery) return;

    const timer = setTimeout(() => {
      const element = categoriesRef.current;

      if (!element) return;

      const offset = 130; // высота твоего fixed header

      const top =
        element.getBoundingClientRect().top +
        window.scrollY -
        offset;

      window.scrollTo({
        top,
        behavior: 'smooth',
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get('scrollToEvents') === 'true') {
      setTimeout(() => {
        eventsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [location]);

  const itemsPerPage = (() => {
    if (isXl) return 4;
    if (isMd) return 3;
    else return 2;
  })();

  const sectionReveal = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: 'easeOut' as const },
  };

  const handleLoginSuccess = () => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  };

  const handleNext = (categoryId: number) => {
    setCategoryIndexes(prevIndexes => ({
      ...prevIndexes,
      [categoryId]: Math.min(
        (prevIndexes[categoryId] || 0) + itemsPerPage,
        (eventsByCategory[categoryId]?.length || 0) - 1
      ),
    }));
  };

  const handlePrev = (categoryId: number) => {
    setCategoryIndexes(prevIndexes => ({
      ...prevIndexes,
      [categoryId]: Math.max((prevIndexes[categoryId] || 0) - itemsPerPage, 0),
    }));
  };

  const handlePersonalizedNext = () => {
    setPersonalizedIndex(prev =>
      Math.min(prev + itemsPerPage, personalizedEvents.length - 1)
    );
  };

  const handlePersonalizedPrev = () => {
    setPersonalizedIndex(prev =>
      Math.max(prev - itemsPerPage, 0)
    );
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/event/event_list');

      console.log('CATEGORIES:', response.data);

      const categories = response.data;

      setCategoriesFromBackend(categories);

      const eventsMap: Record<number, Event[]> = {};

      await Promise.all(
        categories.map(async (category: EventCategory) => {
          try {
            const res = await axios.get(
              `/event/events?group_id=${category.id}`
            );

            console.log(
              `EVENTS FOR CATEGORY ${category.name}:`,
              res.data
            );

            const events = Array.isArray(res.data)
              ? res.data.map((item: any) => normalizeEvent(item))
              : [];

            events.sort((a: Event, b: Event) => {
              const dateA = a.time_slots?.[0]?.date_event
                ? new Date(a.time_slots[0].date_event).getTime()
                : 0;

              const dateB = b.time_slots?.[0]?.date_event
                ? new Date(b.time_slots[0].date_event).getTime()
                : 0;

              return dateA - dateB;
            });

            eventsMap[category.id] = events;
          } catch (error) {
            console.error(
              `Ошибка загрузки событий категории ${category.name}:`,
              error
            );
          }
        })
      );

      setEventsByCategory(eventsMap);

    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  useEffect(() => {
    Modal.setAppElement('#root');

    fetchCategories();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (searchQuery && searchQuery !== previousSearchQuery) {
        setPreviousSearchQuery(searchQuery);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [searchQuery, previousSearchQuery]);

  const categories = createListCollection({
    items: categoriesFromBackend.map(category => ({ label: category.name, value: category?.id?.toString() })),
  });

  const districtItems = [
    { label: 'Норильск', value: 'norilsk' },
    { label: 'Талнах', value: 'talnah' },
    { label: 'Кайеркан', value: 'kayerkan' },
    { label: 'Оганер', value: 'oganeer' },
    { label: 'Дудинка', value: 'dudinka' }
  ];

  const organizationsMap: Record<number, string> = {
    1: 'Заполярный театр драмы',
    4: 'Кинотеатр Родина',
    3: 'Администрация города Норильска',
    2: 'Городской центр культуры',
    5: 'Талнахская детская школа искусств',
    6: 'Норильская детская школа искусств',
    7: 'Культурно-досуговый центр имени В. Высоцкого',
    8: 'Cinema Art Hall',
    9: 'Площадь Набережная',
    10: 'Музей Норильска художественная галерея',
    11: 'Полярная арт-резиденция PolArt',
    12: 'Площадь Комсомольская',
    14: 'КДЦ Юбилейный',
    17: 'Музей НА-Гора',
    16: 'Музей Норильска',
    18: 'СПОРТИВНЫЙ КОМПЛЕКС "ТАЛНАХ"',
    15: 'Таймырский краеведческий музей',
    13: 'Фаблаб-Норильск',
    
  };

  const districts = createListCollection({
    items: districtItems,
  });

  const handleCategoryChange = (event: FormEvent<HTMLDivElement>) => {
    const selectedValues = Array.from(
      (event.target as HTMLSelectElement).selectedOptions,
      option => option.value
    );

    setSelectedCategories(selectedValues);

    // скролл к первой выбранной категории
    if (selectedValues.length > 0) {
      const categoryId = selectedValues[0];

      setTimeout(() => {
        const element = document.getElementById(`category-${categoryId}`);

        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 100);
    }
  };

  const handleDistrictChange = (event: FormEvent<HTMLDivElement>) => {
    const selectedValues = Array.from(
      (event.target as HTMLSelectElement).selectedOptions,
      option => option.value
    );

    setSelectedDistricts(selectedValues);

    if (selectedValues.length > 0) {
      setTimeout(() => {
        const element = categoriesRef.current;

        if (!element) return;

        const offset = 130;

        const top =
          element.getBoundingClientRect().top +
          window.scrollY -
          offset;

        window.scrollTo({
          top,
          behavior: 'smooth',
        });
      }, 100);
    }
  };

const handleDateChange = (dates: [Date | null, Date | null]) => {
  const [start, end] = dates;

  if (start && end && start.getTime() === end.getTime()) {
    console.warn("Ошибка: Дата начала и конца не могут совпадать.");
    setStartDate(start);
    setEndDate(null);
    return;
  }

  setStartDate(start);
  setEndDate(end);

  if (start) {
    console.log("Выбрана дата начала:", start.toLocaleDateString());
  }

  if (end) {
    console.log("Выбрана дата конца:", end.toLocaleDateString());
  }

  if (start && end) {
    console.log("Выбран полный период:", start.toLocaleDateString(), "—", end.toLocaleDateString());
  }
};

const handleClearDate = () => {
  setStartDate(null);
  setEndDate(null);
};

  const handleMyTicketsClick = () => {
    if (userId) {
      navigate('/account');
    } else {
      setIsLoginOpen(true);
    }
  };

  const openLoginModal = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegisterModal = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };
 
const isEventInSelectedDateRange = (event: Event) => {
  if (!startDate) return true;

  const eventDates = event.time_slots.map(slot => {
    const d = new Date(slot.date_event);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  // выбрана одна дата
  if (!endDate) {
    return eventDates.some(
      eventDate => eventDate === start.getTime()
    );
  }

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // выбран период
  return eventDates.some(
    eventDate =>
      eventDate >= start.getTime() &&
      eventDate <= end.getTime()
  );
};

  const filterEventsBySearchQuery = (events: Event[]) => {
  return events.filter(event => {
    const matchesSearchQuery =
      !searchQuery ||
      event.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesDistrict =
      selectedDistricts.length === 0 ||
      selectedDistricts.includes(
        event.city?.toLowerCase()
      );

    const matchesDate =
      isEventInSelectedDateRange(event);

    return (
      matchesSearchQuery &&
      matchesDistrict &&
      matchesDate
    );
  });
};

useEffect(() => {
  if (!startDate) return;

  const element = categoriesRef.current;
  if (!element) return;

  const offset = 130;

  const top =
    element.getBoundingClientRect().top +
    window.scrollY -
    offset;

  window.scrollTo({
    top,
    behavior: 'smooth',
  });
}, [startDate, endDate]);

  const areFiltersApplied = 
  selectedCategories.length > 0 || 
  selectedDistricts.length > 0 || 
  startDate !== null || 
  endDate !== null;

  const filteredCategories = categoriesFromBackend.filter(category => {
    // const filteredEvents =
    //   filterEventsBySearchQuery(
    //     eventsByCategory[category.id] || [] // моё изменение проверить 
    //   );

    // if (
    //   selectedCategories.length > 0 &&
    //   !selectedCategories.includes(category.id.toString())
    // ) {
    //   return false;
    // }

    const filteredEvents = filterEventsBySearchQuery(eventsByCategory[category.id] || []);
    return filteredEvents.length > 0;
  });

  const hasVisibleEvents = filteredCategories.some(category => {
    const filteredEvents = filterEventsBySearchQuery(
      eventsByCategory[category.id] || []
    );

    if (
      selectedCategories.length > 0 &&
      !selectedCategories.includes(category.id.toString())
    ) {
      return false;
    }

    return filteredEvents.length > 0;
  });

  const uniqueEvents = Array.from(
  new Map(
    Object.values(eventsByCategory)
      .flat()
      .map(event => [event.id, event])
  ).values()
);

const getEventNearestDate = (event: Event) => {
  const timestamps = event.time_slots
    .map(slot => new Date(slot.date_event).getTime())
    .filter(Boolean);

  return timestamps.length ? Math.min(...timestamps) : Infinity;
};

const baseEvents = Object.values(eventsByCategory).flat();

const now = new Date().setHours(0, 0, 0, 0);

const personalizedEvents = isAuthenticated
  ? baseEvents
      .filter(event => {
        const hasPrefs = safeUserCategories.length > 0;

        const matchesUserCategory =
          !hasPrefs ||
          userCategoriesStr.includes(String(event.group_id));

        // 🔥 фильтр: только будущие события
        const eventDates = event.time_slots
          .map(slot => new Date(slot.date_event).getTime())
          .filter(Boolean);

        const hasFutureDate = eventDates.some(date => date >= now);

        return matchesUserCategory && hasFutureDate;
      })
      .sort((a, b) => {
        return getEventNearestDate(a) - getEventNearestDate(b);
      })
  : [];

  return (
    <ContainerFluid>
      <Flex direction="column" align="center" height="100%">
        <ContainerFluid position="fixed" zIndex={1} top={{ base: "90px" }} >
          <Flex
            justify={{ base: "center", md: "space-between" }}
            direction={{ base: "column", md: "row" }}
            align={{ base: "flex-start", md: "center" }}
            flexWrap={{ base: "wrap", md: "nowrap" }}
            gap={{ base: 2, md: 0 }}
            textAlign={{ base: "left", md: "left" }}
            fontFamily="Unbounded"
            w="100%"
            bg="rgba(22, 27, 66, 0.45)"
            border="1px solid rgba(255,255,255,0.22)"
            borderRadius="20px"
            px={{ base: 2, md: 3, xl: 4 }}
            py={2}
            boxShadow="0 10px 28px rgba(7, 11, 34, 0.33)"
            backdropFilter="blur(6px)"
          >
            <HStack w={{ base: "100%", md: "auto" }}
                justify={{ base: "space-between", md: "flex-start" }} 
                gap={{ base: '1', lg: '4', xl: '4' }}>
              <Box
                ml={{ base: "0px", md: "0" }}
                bg="white"
                borderRadius="full"
                color="black"
                py={{ base: '4px', md: '6px' }}
                px={{ base: '8px',  sm:"20px", md: '26px' }}
                
                position="relative"
                height={{ base: '36px', md: '40px' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize={{ base: 'xs', sm:"13px", md: 'sm' }}
                userSelect="none"
                cursor="pointer"
                boxShadow="0 6px 16px rgba(13, 18, 45, 0.16)"
                _hover={{ bg: 'gray.50', boxShadow: '0 10px 20px rgba(13, 18, 45, 0.22)' }}
                transition="all 0.2s"
                
              >
                            
              <DatePicker
                open={isCalendarOpen}
                onInputClick={() => setIsCalendarOpen(true)}
                onClickOutside={() => setIsCalendarOpen(false)}
                disabledKeyboardNavigation
                selected={startDate}

                onChange={(date: Date | null) => {
                  if (!date) return;

                  if (!startDate || (startDate && endDate)) {
                    setStartDate(date);
                    setEndDate(null);
                    return;
                  }

                  if (date.getTime() === startDate.getTime()) {
                    return;
                  }

                  if (date > startDate) {
                    setEndDate(date);
                  } else {
                    setEndDate(startDate);
                    setStartDate(date);
                  }

                  setIsCalendarOpen(false);
                }}

                dateFormat="dd.MM.yyyy"
                minDate={new Date()}
                wrapperClassName="date-picker-wrapper"
                popperPlacement="bottom-start"
                popperClassName="react-datepicker-popper"

                customInput={
                  <Text
                    fontSize={{ base: '10px', sm: "12px", md: 'sm', lg: '15px', '2xl': '15px' }}
                    whiteSpace="nowrap"
                    display="inline-block"
                  >
                    {startDate && endDate
                      ? `${startDate.toLocaleDateString()} — ${endDate.toLocaleDateString()}`
                      : startDate
                        ? startDate.toLocaleDateString()
                        : "Даты"}
                  </Text>
                }
              />
              {(startDate || endDate) && (
                  <Button
                    position="absolute"
                    p={0}
                    right={{ base: '-30px', sm:"-9px", md: '-4px' }}
                    top="0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearDate();
                    }}
                    bg="transparent"
                    border="none"
                    color="black"
                  >
                    <Image src={cross} alt="Отменить" boxSize={{ base: '20px', sm:"15px", md: '15px' }} />
                  </Button>
                )}
              </Box>
              <SelectRoot
                className="light"
                size={{ base: 'sm',  md: 'md' }}
                multiple
                collection={categories}
                bg="white"
                overflow="hidden"
                borderRadius="full"
                boxShadow="0 6px 16px rgba(13, 18, 45, 0.16)"
                onChange={handleCategoryChange}
                flexShrink={0}
                flexGrow={0}
                w="fit-content"
                
                
              >
                <SelectTrigger width="fit-content"
                    minW={{ base: '16px',  md: '180px' }}>
                  <Box
                    textWrap="nowrap"
                    as="span"
                    pr={{ base: '16px', sm:"20px", md: '20px' }}
                    fontSize={{ base: '10px', sm:"12px", md: 'sm' }}
                    color="black"
                    cursor="pointer"
                  >
                    Категории
                  </Box>
                </SelectTrigger>
                <SelectContent borderRadius="xl" border="1px solid rgba(76, 107, 230, 0.25)" boxShadow="0 14px 24px rgba(10, 17, 46, 0.22)">
                  {categories.items.map(category => (
                    <SelectItem item={category} key={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
              </HStack>
            
            <HStack gap={{ base: '1', lg: '4', xl: '4' }}
                    w={{ base: "100%", md: "auto" }}
                    justify={{ base: "space-between", md: "flex-end" }}>
              <SelectRoot
                className="light"
                size={{ base: 'sm', md: 'md' }}
                multiple
                flexShrink={0}
                w="fit-content"
                collection={districts}
                bg="white"
                overflow="hidden"
                borderRadius="full"
                boxShadow="0 6px 16px rgba(13, 18, 45, 0.16)"
                onChange={handleDistrictChange}
                mr={{ sm: "140px", md: "0px" }}
                
              >
                <SelectTrigger width={{ base: "120px", sm: "140px", md: "185px" }}>
                  <Flex alignItems="center" gap="5px" pr={{ base: '16px', md: '20px' }} width={{ base: "80px", md: "auto" }}>
                    <Image
                      src={position}
                      display={{ base: 'none', md: 'block' }}
                      alt="Местоположение"
                      boxSize={{ base: '16px', md: '20px' }}
                      objectFit="contain"
                    />
                    <Box as="span" fontSize={{ base: '10px', sm: "12px", md: 'sm' }} color="black" cursor="pointer">
                      Районы
                    </Box>
                  </Flex>
                </SelectTrigger>
                <SelectContent borderRadius="xl" border="1px solid rgba(76, 107, 230, 0.25)" boxShadow="0 14px 24px rgba(10, 17, 46, 0.22)">
                  {districts.items.map(district => (
                    <SelectItem item={district} key={district.value}>
                      {district.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>

              <Button
                maxHeight={{ base: '36px', md: '40px' }}
                bg="white"
                borderRadius="full"
                flexShrink={0}
                flexGrow={0}
                w="fit-content"
                color="black"
                fontSize={{ base: '10px', sm: "12px", md: 'sm' }}
                height="40px"
                px={{ base: '10px', md: '16px' }}
                _hover={{ bg: 'gray.50' }}
                transition="all 0.2s"
                onClick={() => setIsCalendarModalOpen(true)}
                fontWeight="400"
                boxShadow="0 6px 16px rgba(13, 18, 45, 0.16)"
                
              >
                <Image
                  display={{ base: 'none', md: 'block' }}
                  src={ticket}
                  alt="Билет"
                  boxSize={{ base: '16px', md: '20px' }}
                  objectFit="contain"
                />
                <Text>Календарь событий</Text>
              </Button>
            </HStack>
            </Flex>
        </ContainerFluid>

        <motion.div {...sectionReveal} style={{ width: '100%' }}>
          <VStack
            mt={{ base: "100px", md: "40px" }}
            align="center"
            maxW={{ md: '75%', base: '90%' }}
            p={{ lg: 10, base: 4 }}
            color="white"
            userSelect="none"
            mx="auto"
            bg="rgba(14, 20, 58, 0.34)"
            border="1px solid rgba(255,255,255,0.2)"
            borderRadius="28px"
            boxShadow="0 18px 34px rgba(7, 11, 34, 0.28)"
            backdropFilter="blur(4px)"
          >
            <Heading
              as="h1"
              fontWeight={500}
              lineHeight={1}
              fontSize={{ xl: '68px', lg: '32px', sm:"30px", base: '20px' }}
              alignSelf="center"
              fontFamily="Unbounded"
              textShadow="0 10px 28px rgba(0,0,0,0.35)"
            >
              Афиша
            </Heading>
            <Heading
              as="h1"
              fontWeight={500}
              lineHeight={1}
              fontSize={{ xl: '68px', lg: '32px', sm:"30px", base: '22px' }}
              alignSelf="center"
              fontFamily="Unbounded"
              textShadow="0 10px 28px rgba(0,0,0,0.35)"
            >
              Норильска
            </Heading>
            <Text
              fontSize={{ xl: '24px', lg: '16px', sm:"15px", base: '12px' }}
              fontWeight="300"
              mt={{ xl: '20px', lg: '20px', sm:"10px", base: '5px' }}
              textAlign="center"
              fontFamily="Unbounded"
              lineHeight={1.65}
            >
              На нашем сайте вы найдете актуальные мероприятия в Норильске и других районах, чтобы каждый мог легко
              выбрать что-то интересное для себя. Развлекайтесь и наслаждайтесь яркими моментами города!
            </Text>
          </VStack>
        </motion.div>

        <Grid
          width={{ base: "80%", md: "100%", lg: "100%", '2xl': "100%" }}
          templateColumns={{ base: '1fr', md: 'repeat(4, minmax(0, 1fr))' }}
          alignItems="center"
          gap={4}
          mt={6}
          fontFamily="Unbounded"
          userSelect="none"
        >
          <Box
            bg="#BCC7F6"
            color="white"
            borderRadius="full"
            textTransform="uppercase"
            height={{ base: '70px', lg: '118px', '2xl': '140px' }}
            fontSize={{ xl: '4xl', lg: '3xl' }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            transition="all .2s ease"
            boxShadow="0 10px 24px rgba(13, 18, 45, 0.2)"
            _hover={{ transform: 'translateY(-2px)', boxShadow: '0 14px 28px rgba(13, 18, 45, 0.3)' }}
          >
            все
          </Box>
          <Box
            colorScheme="white"
            color="black"
            borderRadius="full"
            height={{ base: '70px', lg: '118px', '2xl': '140px' }}
            textTransform="uppercase"
            fontSize={{ xl: '3xl', lg: '2xl' }}
            display="flex"
            bgColor="white"
            bgImage={`url(${box})`}
            alignItems="center"
            bgSize="cover"
            bgRepeat="no-repeat"
            justifyContent="center"
            transition="all .2s ease"
            boxShadow="0 10px 24px rgba(13, 18, 45, 0.2)"
            _hover={{ transform: 'translateY(-2px)', boxShadow: '0 14px 28px rgba(13, 18, 45, 0.3)' }}
          >
            события
          </Box>
          <Box
            bg="#4C6BE6"
            color="white"
            borderRadius="full"
            textTransform="uppercase"
            height={{ base: '70px', lg: '118px', '2xl': '140px' }}
            fontSize={{ xl: '3xl', lg: '2xl' }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            transition="all .2s ease"
            boxShadow="0 10px 24px rgba(13, 18, 45, 0.2)"
            _hover={{ transform: 'translateY(-2px)', boxShadow: '0 14px 28px rgba(13, 18, 45, 0.3)' }}
          >
            вашего 
          </Box>
          <Box
            bg="white"
            color="black"
            borderRadius="full"
            textTransform="uppercase"
            height={{ base: '70px', lg: '118px', '2xl': '140px' }}
            fontSize={{ xl: '3xl', lg: '2xl' }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            transition="all .2s ease"
            boxShadow="0 10px 24px rgba(13, 18, 45, 0.2)"
            _hover={{ transform: 'translateY(-2px)', boxShadow: '0 14px 28px rgba(13, 18, 45, 0.3)' }}
          >
            города
          </Box>
        </Grid>
         {isAuthenticated && personalizedEvents.length > 0 && (
          <Box
            mt={9}
            w={{base: "350px", sm: "470px", xl: "1100px"}}
                p={4}
              
                color="white"
                userSelect="none"
                zIndex={0}
                bg="rgba(17, 23, 58, 0.5)"
                border="1px solid rgba(255,255,255,0.15)"
                borderRadius="24px"
                boxShadow="0 14px 30px rgba(7, 11, 34, 0.24)"
          >
            <Heading
              lineHeight={1}
              fontSize={{ xl: '64px', lg: '40px', sm: '30px', base: '20px' }}
              fontFamily="Unbounded"
              color="white"
              textAlign="center"
              textShadow="0 8px 22px rgba(148, 146, 146, 0.3)"
            >
              Подборка для вас
            </Heading>
          
            <Flex
              justify="center"
              gap={8}
              mt={{ base: '30px', lg: '20px', xl: '60px' }}
              wrap="wrap"
            >
              {personalizedEvents
                .slice(
                  personalizedIndex,
                  personalizedIndex + itemsPerPage
                )
                .map((event, index) => (
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
                                filter: 'drop-shadow(0 14px 24px rgba(51, 63, 120, 0.42))',
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
                                <Text fontSize={{ lg: '12px', base: '10px' }} ml={2}>
                                {
                                  organizationsMap[event.organization] ||
                                  'Неизвестная организация'
                                }
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
            </Flex>
            
            {personalizedEvents.length > itemsPerPage && (
            <HStack justify="flex-end" w={{ xl: '100%', lg: '88%' }} mt={4}>
              <Button
                onClick={handlePersonalizedPrev}
                disabled={personalizedIndex === 0}
                bg="transparent"
                mr={2}
                borderRadius="full"
                boxShadow="0 0 0 2px white"
                width={{ xl: '50px', sm: '45px', base: '40px' }}
                height={{ xl: '50px', sm: '45px', base: '40px' }}
                _disabled={{ cursor: 'default', opacity: 0.5 }}
                _hover={{ bg: 'rgba(255,255,255,0.12)' }}
              >
                <FaArrowLeft color="white" />
              </Button>

              <Button
                onClick={handlePersonalizedNext}
                disabled={
                  personalizedIndex + itemsPerPage >=
                  personalizedEvents.length
                }
                bg="transparent"
                borderRadius="full"
                boxShadow="0 0 0 2px white"
                width={{ xl: '50px', sm: '45px', base: '40px' }}
                height={{ xl: '50px', sm: '45px', base: '40px' }}
                _disabled={{ cursor: 'default', opacity: 0.5 }}
                _hover={{ bg: 'rgba(255,255,255,0.12)' }}
              >
                <FaArrowRight color="white" />
              </Button>
            </HStack>
          )}
          </Box>
        )}
      {hasVisibleEvents && (
        <Text
          mt={{ base: '5', xl: '10' }}
          mb={{ base: '2', xl: '6' }}
          textAlign="center"
          fontFamily="Unbounded"
          fontSize={{ base: '25px', sm: '35px', md: '28px', xl: '70px' }}
          fontWeight="500"
          color="white"
          textShadow="0 8px 22px rgba(0,0,0,0.3)"
        >
          Все события по категориям
        </Text>
      )}
        <Box ref={categoriesRef}>
        {hasVisibleEvents ? (
          filteredCategories.map(category => {
            const filteredEvents = filterEventsBySearchQuery(eventsByCategory[category.id] || []);
            
            if (selectedCategories.length > 0 && !selectedCategories.includes(category.id.toString())) {
              return null;
            }
            if (filteredEvents.length === 0) {
              return null;
            }
          
            return (
              <Box
                mt={4}
                id={`category-${category.id}`}
                scrollMarginTop="120px"
                key={category.id}
                w={{base: "350px", sm: "470px",xl: "1100px"}}
                p={4}
                color="white"
                userSelect="none"
                zIndex={0}
                bg="rgba(17, 23, 58, 0.5)"
                border="1px solid rgba(255,255,255,0.15)"
                borderRadius="24px"
                boxShadow="0 14px 30px rgba(7, 11, 34, 0.24)"
              >
                <Heading
                  lineHeight={1}
                  fontSize={{ xl: '64px', lg: '40px', sm:'30px', base: '25px' }}
                  fontFamily="Unbounded"
                  color="white"
                  textAlign="center"
                  textShadow="0 8px 22px rgba(0,0,0,0.3)"
                >
                  {category.name}
                </Heading>
                <Flex justify="center" gap={8} mt={{ base: '25px', lg: '20px', xl: '60px' }} zIndex={2}>
                  {filteredEvents.length ? (
                    filteredEvents
                      .slice(categoryIndexes[category.id] || 0, (categoryIndexes[category.id] || 0) + itemsPerPage)
                      .map((event, index) => (
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
                                <Text fontSize={{ lg: '12px', base: '10px' }} ml={2}>
                                {
                                  organizationsMap[event.organization] ||
                                  'Неизвестная организация'
                                }
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
                      ))
                  ) : (
                    <Text color="white" fontFamily="Unbounded">
                      Нет подходящих мероприятий для данной категории по вашим фильтрам
                    </Text>
                  )}
                </Flex>
                {filteredEvents.length > 0 && (
                  <HStack justify="flex-end" w={{ xl: '100%', lg: '88%' }} mt={4}>
                    <Button
                      onClick={() => handlePrev(category.id)}
                      disabled={(categoryIndexes[category.id] || 0) === 0}
                      bg="transparent"
                      mr={2}
                      borderRadius="full"
                      boxShadow="0 0 0 2px white"
                      width={{ xl: '50px',  sm: '45px', base: '40px' }}
                      height={{ xl: '50px', sm: '45px', base: '40px' }}
                      _disabled={{ cursor: 'default', opacity: 0.5 }}
                      _hover={{ bg: 'rgba(255,255,255,0.12)' }}
                    >
                      <FaArrowLeft color="white"/>
                    </Button>
                    <Button
                      onClick={() => handleNext(category.id)}
                      disabled={(categoryIndexes[category.id] || 0) + itemsPerPage >= filteredEvents.length}
                      bg="transparent"
                      borderRadius="full"
                      boxShadow="0 0 0 2px white"
                      width={{ xl: '50px',  sm: '45px', base: '40px' }}
                      height={{ xl: '50px', sm: '45px', base: '40px' }}
                      _disabled={{ cursor: 'default', opacity: 0.5 }}
                      _hover={{ bg: 'rgba(255,255,255,0.12)' }}
                    >
                      <FaArrowRight color="white"/>
                    </Button>
                  </HStack>
                )}
              </Box>
            );
          })
        ) : (
          <Text
            flex={1}
            mt="30px"
            mb="30px"
            alignContent={'center'}
            color="white"
            fontSize={{ base: '24px', lg: '48px', xl: '64px' }}
            textAlign="center"
            width="100%"
            fontFamily="Unbounded"
          >
            По вашим фильтрам ничего не найдено
          </Text>
        )}</Box>
      </Flex>
      <LoginModal
        isOpen={isLoginOpen}
        onRequestClose={() => setIsLoginOpen(false)}
        openRegisterModal={openRegisterModal}
        onLoginSuccess={handleLoginSuccess}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onRequestClose={() => setIsRegisterOpen(false)}
        openLoginModal={openLoginModal}
      />
      <EventCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
    </ContainerFluid>
  );
};

export default Frame;