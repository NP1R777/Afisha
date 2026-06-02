import { Box, Button, createListCollection, Flex, Grid, Heading, HStack, Image, Text, useMediaQuery, VStack} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FormEvent, useEffect, useState } from 'react';
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
import EVENTS from '../shared/config/mock.json';
import EventImage from '../pictures/picture.png';
import EventCalendarModal from '../modal/calendar';

interface Event {
  id?: number;
  external_url: string;
  name: string;
  description: string;
  location: string;
  group_id: number;
  date_event: string[];
  duration: string;
  price: string;
  address: string;
  city: string;
  age_limit: string;
  pictures_url: string;
  horizontal_picture_url: string | null;
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
  const { userId, categories: userCategories, setUsername, searchQuery } = useUser();
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

  const itemsPerPage = (() => {
    if (isXl) return 4;
    if (isMd) return 3;
    else return 2;
  })();

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
  // const fetchCategories = async () => {
  //   try {
  //     const response = await axios.get('/event/event_list');
  //     const categories = response.data;
  //     setCategoriesFromBackend(categories);

  //     const eventsMap: Record<number, Event[]> = {};
  //     await Promise.all(
  //       categories.map(async (category: EventCategory) => {
  //         try {
  //           const selectedLabels = selectedDistricts
  //             .filter((value): value is string => value !== undefined)
  //             .map(value => districtItems.find(item => item.value === value)?.label)
  //             .filter(label => label !== undefined);

  //           const districtFilter = selectedLabels.length
  //             ? selectedLabels.map(district => `city=${district}`).join('&')
  //             : '';

  //           const dateFilter = formattedDate ? `date_event=${formattedDate}` : '';

  //           const filters = [districtFilter, dateFilter].filter(Boolean).join('&');

  //           const url = filters
  //             ? `/event/events?group_id=${category.id}&${filters}`
  //             : `/event/events?group_id=${category.id}`;

  //           const res = await axios.get(url);
  //           const events = res.data;

  //           events.sort((a: Event, b: Event) => new Date(a.date_event).getTime() - new Date(b.date_event).getTime());
  //           eventsMap[category.id] = res.data;
  //         } catch (error) {
  //           console.error(`Ошибка при загрузке мероприятий для категории ${category.name}:`, error);
  //         }
  //       })
  //     );
  //     setEventsByCategory(eventsMap);
  //   } catch (error) {
  //     console.error('Ошибка при загрузке категорий:', error);
  //   }
  // };

  // useEffect(() => {
  //   Modal.setAppElement('#root');
  //   fetchCategories();
  // }, [selectedDistricts, formattedDate]);

  useEffect(() => {
    Modal.setAppElement('#root');
    setCategoriesFromBackend(EVENTS.categories);
    const eventsMap: Record<number, Event[]> = {};
    EVENTS.categories.forEach((category) => {
      const filteredEvents = EVENTS.events
        .filter((event) => event.group_id === category.id)
        .map((event) => ({
          ...event,
          picture_url: event.pictures_url, 
        }));
      eventsMap[category.id] = filteredEvents;
    });
    setEventsByCategory(eventsMap);
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
    { label: 'Талнах', value: 'talnakx' },
    { label: 'Кайеркан', value: 'kayerkan' },
  ];

  const districts = createListCollection({
    items: districtItems,
  });

  const handleCategoryChange = (event: FormEvent<HTMLDivElement>) => {
    const selectedValues = Array.from((event.target as HTMLSelectElement).selectedOptions, option => option.value);
    setSelectedCategories(selectedValues);
  };

  const handleDistrictChange = (event: FormEvent<HTMLDivElement>) => {
    const selectedValues = Array.from((event.target as HTMLSelectElement).selectedOptions, option => option.value);
    setSelectedDistricts(selectedValues);
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
  
  const filterEventsBySearchQuery = (events: Event[]) => {
    if (!searchQuery && selectedCategories.length === 0) return events;
  
    return events.filter(event => {
      const matchesSearchQuery = !searchQuery || event.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSelectedCategories = selectedCategories.length === 0 || selectedCategories.includes(event.group_id.toString());
      return matchesSearchQuery && matchesSelectedCategories;
    });
  };

  const userCategoriesStr = userCategories?.map(String) || [];
  const areFiltersApplied = 
  selectedCategories.length > 0 || 
  selectedDistricts.length > 0 || 
  startDate !== null || 
  endDate !== null;

  const filteredCategories = categoriesFromBackend.filter(category => {
    const filteredEvents = filterEventsBySearchQuery(eventsByCategory[category.id] || []);
    if (!userId || !userCategories || userCategories.length === 0) {
      return true;
    }
    const userCategoriesStr = userCategories?.map(String) || [];
    const isCategoryInUserCategories = userCategoriesStr.includes(category.id.toString());
  
    if (areFiltersApplied) {
      return filteredEvents.length > 0;
    } else {
      return isCategoryInUserCategories && filteredEvents.length > 0;
    }
  });

  const personalizedEvents = EVENTS.events
    .filter(event => {
      const category = EVENTS.categories.find(
        category => category.id === event.group_id
      );

      return category?.name.toLowerCase() === 'театр';
    })
    .sort(
      (a, b) =>
        new Date(a.date_event[0]).getTime() -
        new Date(b.date_event[0]).getTime()
    )
    .slice(0, 12);


  return (
    <ContainerFluid>
      <Flex direction="column" align="center" height="100%">
        <ContainerFluid position="fixed" zIndex={1}>
          <Flex justify="space-between" fontFamily="Unbounded" w="100%">
            <HStack gap={{ xl: '4', lg: '4', base: '1' }}>
              <Box
                
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
                _hover={{ bg: 'gray.50' }}
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
                    fontSize={{ base: '8px', sm: "12px", md: 'sm', lg: '15px', '2xl': '15px' }}
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
                    right={{ base: '-2px', sm:"-9px", md: '-4px' }}
                    top="0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearDate();
                    }}
                    bg="transparent"
                    border="none"
                    color="black"
                  >
                    <Image src={cross} alt="Отменить" boxSize={{ base: '12px', sm:"15px", md: '15px' }} />
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
                onChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <Box
                    textWrap="nowrap"
                    as="span"
                    pr={{ base: '16px', sm:"20px", md: '20px' }}
                    fontSize={{ base: '8px', sm:"12px", md: 'sm' }}
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
            </HStack>
            <HStack gap={{ base: '1', lg: '4', xl: '4' }}>
              <SelectRoot
                className="light"
                size={{ base: 'sm', md: 'md' }}
                multiple
                collection={districts}
                bg="white"
                overflow="hidden"
                borderRadius="full"
                onChange={handleDistrictChange}
              >
                <SelectTrigger>
                  <Flex alignItems="center" gap="5px" pr={{ base: '16px', md: '20px' }}>
                    <Image
                      src={position}
                      display={{ base: 'none', md: 'block' }}
                      alt="Местоположение"
                      boxSize={{ base: '16px', md: '20px' }}
                      objectFit="contain"
                    />
                    <Box as="span" fontSize={{ base: '10px', md: 'sm' }} color="black" cursor="pointer">
                      Районы
                    </Box>
                  </Flex>
                </SelectTrigger>
                <SelectContent borderRadius="xl">
                  {districts.items.map(district => (
                    <SelectItem item={district} key={district.value}>
                      {district.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>

              {/* <Button //нужен или нет вообщев
                maxHeight={{ base: '36px', md: '40px' }}
                bg="white"
                borderRadius="full"
                onClick={handleMyTicketsClick}
                color="black"
                fontSize={{ base: '8px', md: 'sm' }}
                height="40px"
                px={{ base: '10px', md: '16px' }}
                _hover={{ bg: 'gray.50' }}
                transition="all 0.2s"
              >
                <Image
                  display={{ base: 'none', md: 'block' }}
                  src={ticket}
                  alt="Билет"
                  boxSize={{ base: '16px', md: '20px' }}
                  objectFit="contain"
                />
                <Text>Мои билеты</Text>
              </Button> */}
              <Button
                maxHeight={{ base: '36px', md: '40px' }}
                bg="white"
                borderRadius="full"
                color="black"
                fontSize={{ base: '8px', md: 'sm' }}
                height="40px"
                px={{ base: '10px', md: '16px' }}
                _hover={{ bg: 'gray.50' }}
                transition="all 0.2s"
                onClick={() => setIsCalendarModalOpen(true)}
                fontWeight="400"
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

        <VStack
          mt="40px"
          align="center"
          maxW={{ md: '75%', base: '90%' }}
          p={{ lg: 10, base: 4 }}
          color="white"
          userSelect="none"
        >
          <Heading
            as="h1"
            fontWeight={500}
            lineHeight={1}
            fontSize={{ xl: '68px', lg: '32px', sm:"30px", base: '16px' }}
            alignSelf="center"
            
            fontFamily="Unbounded"
          >
            Афиша
          </Heading>
          <Heading
            as="h1"
            fontWeight={500}
            lineHeight={1}
            
            fontSize={{ xl: '68px', lg: '32px', sm:"30px", base: '16px' }}
            alignSelf="center"
            fontFamily="Unbounded"
          >
            Норильска
          </Heading>
          <Text
            fontSize={{ xl: '24px', lg: '16px', sm:"15px", base: '12px' }}
            fontWeight="300"
            mt={{ xl: '20px', lg: '20px', sm:"30px", base: '5px' }}
            textAlign="center"
            fontFamily="Unbounded"
          >
            На нашем сайте вы найдете актуальные мероприятия в Норильске и других районах, чтобы каждый мог легко
            выбрать что-то интересное для себя. Развлекайтесь и наслаждайтесь яркими моментами города!
          </Text>
        </VStack>

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
          >
            города
          </Box>
        </Grid>
        {personalizedEvents.length > 0 && (
          <Box mt={9} w="100%" p={4} color="white" userSelect="none" zIndex={0}>
            <Heading
              lineHeight={1}
              fontSize={{ xl: '64px', lg: '40px', base: '30px' }}
              fontFamily="Unbounded"
              color="white"
              textAlign="center"
            >
              Подборка для вас
            </Heading>

            <Flex
              justify="center"
              gap={8}
              mt={{ base: '35px', lg: '20px', xl: '60px' }}
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
                        gap={1}
                        w={{ xl: '240px', sm: '200px', base: '140px' }}
                        position="relative"
                      >
                        <Image
                          src={event.pictures_url}
                          alt={event.name}
                          width="100%"
                          height={{ xl: '360px', md: '300px', sm: '290px', base: '200px' }}
                          borderRadius="6px"
                          objectFit="cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = EventImage;
                          }}
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
                              ? 'Бесплатно'
                              : `от ${event.price} руб`}
                          </Text>
                        </Box>
                      </VStack>
                    </Link>
                  </motion.div>
                ))}
            </Flex>
              {personalizedEvents.length > itemsPerPage && (
            <HStack justify="flex-end" w={{ xl: '92%', lg: '88%' }} mt={4}>
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
              >
                <FaArrowRight color="white" />
              </Button>
            </HStack>
          )}
          </Box>
        )}
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => {
            const filteredEvents = filterEventsBySearchQuery(eventsByCategory[category.id] || []);
            
            if (selectedCategories.length > 0 && !selectedCategories.includes(category.id.toString())) {
              return null;
            }
            if (filteredEvents.length === 0) {
              return null;
            }
            console.log(`Rendering category ${category.name} with events:`, filteredEvents);
            return (
              <Box mt={4} key={category.id} w="100%" p={4} color="white" userSelect="none" zIndex={0}>
                <Heading
                  lineHeight={1}
                  fontSize={{ xl: '64px', lg: '40px', base: '30px' }}
                  fontFamily="Unbounded"
                  color="white"
                  textAlign="center"
                >
                  {category.name}
                </Heading>
                <Flex justify="center" gap={8} mt={{ base: '35px', lg: '20px', xl: '60px' }} zIndex={2}>
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
                            >
                              <Image
                                src={event.pictures_url}
                                alt={event.name}
                                width="100%"
                                height={{ xl: '360px', md: '300px', sm: "290px", base: '200px' }}
                                borderRadius="6px"
                                objectFit="cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = EventImage;
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
                  <HStack justify="flex-end" w={{ xl: '92%', lg: '88%' }} mt={4}>
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
            mt="16px"
            alignContent={'center'}
            color="white"
            fontSize={{ base: '24px', lg: '48px', xl: '64px' }}
            textAlign="center"
            width="100%"
            fontFamily="Unbounded"
          >
            Упс, ничего не найдено
          </Text>
        )}
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