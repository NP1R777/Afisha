import { Box, Flex, Image, Button, Text, useBreakpointValue, SimpleGrid, Badge, HStack, VStack, Icon } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../addition/context';
import comp from '../pictures/comp.png';
import EditingModal from '../modal/editing';
import CreateModal from '../pages/creature';
import CategoriesModal from '../pages/categories';
import axios from '../shared/lib/axios';
import { ContainerFluid } from '../components/ui/container';
import { Toaster, toaster } from "../components/ui/toaster"
import { Calendar } from '../modal/org_calendar';
import OrganizerRegisterModal from '../modal/org_registration';
import EventImage from '../pictures/picture1.png';
import { motion } from 'framer-motion';
import { FiCalendar, FiHeart, FiMapPin, FiSettings, FiStar, FiUser } from 'react-icons/fi';

interface Event {
  id: number;
  name: string;
  dateLabel: string;
  monthLabel: string;
  timeLabel: string;
  price: number | null;
  location: string;
  picture_url: string;
  age_limit: string | null;
}

interface Category {
  id: number;
  name: string;
}

const Account = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { username, userId, role, setRole, setEmail, setBirthdate, categories, setCategories,setUsername } = useUser();
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isOrganizerRegisterOpen, setIsOrganizerRegisterOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const navigate = useNavigate();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openOrganizerRegisterModal = () => setIsOrganizerRegisterOpen(true);

  const closeOrganizerRegisterModal = () => {
    setIsOrganizerRegisterOpen(false);
  };

  const openEditingModal = () => setIsEditingModalOpen(true);
  const closeEditingModal = () => setIsEditingModalOpen(false);

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false); //для календаря

  const openCategoriesModal = () => {
    setIsCategoriesModalOpen(true);
  };

  const closeCategoriesModal = () => {
    setIsCategoriesModalOpen(false);
    fetchUserData();
  };

  const handleCreateSuccess = () => {
    console.log('Мероприятие успешно создано!');
  };

  
  const fetchUserData = async () => {

    if (!userId) return;

    try {

      const response = await axios.get(
        `/user/get_user?user_id=${userId}`
      );

      const data = response.data;

      console.log('USER DATA:', data);

      if (data.username) {
        setUsername(data.username);
      }

      if (data.email) {
        setEmail(data.email);
      }

      if (data.date_of_birth) {
        setBirthdate(data.date_of_birth);
      }

      setCategories(data.preferences || []);
      if (data.role === 'user' || data.role === 'admin' || data.role === 'organizator') {
        setRole(data.role);
      }

    } catch (error) {

      console.error(
        'Ошибка при получении данных пользователя:',
        error
      );
    }
  };

  const fetchEvents = async () => {

    if (!userId) return;

    try {

      const response = await axios.get(
        `/user/get_like_events?user_id=${userId}`
      );

      const data = response.data;
      const extracted = extractEventsFromResponse(data);
      const normalized = extracted
        .map(normalizeFavoriteEvent)
        .filter((event): event is Event => event !== null);
      setEvents(normalized);

    } catch (error) {

      console.error(
        'Ошибка при получении мероприятий:',
        error
      );
      setEvents([]);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchEvents();
  }, [userId]);

  const fetchCategories = async () => {
    try {

      const response = await axios.get(
        '/event/event_list'
      );

      setAllCategories(response.data);

    } catch (error) {

      console.error(error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const getPreferenceText = (id: number) => {

    return allCategories.find(
      (category) => category.id === id
    )?.name || 'Неизвестно';
  };

  const formatTime = (time?: string) => {
    if (!time) return '—';

    return time.substring(0, 5);
  };

  const formatPrice = (rawPrice: number | null): string => {
    if (rawPrice === null || Number.isNaN(rawPrice)) {
      return 'Цена не указана';
    }
    if (rawPrice === 0) {
      return 'Бесплатно';
    }
    return `от ${rawPrice} ₽`;
  };

  const formatAgeLimit = (ageLimit?: string | null) => {
    if (!ageLimit) {
      return '0+';
    }

    const trimmedAgeLimit = ageLimit.trim();

    return /^\d+$/.test(trimmedAgeLimit)
      ? `${trimmedAgeLimit}+`
      : trimmedAgeLimit;
  };

  const getTruncatedUsername = (name: string) => {
    if (name.length > 10) {
      return name.substring(0, 10) + '...';
    }
    return name;
  };

  const monthNames = ['ЯНВАРЯ', 'ФЕВРАЛЯ', 'МАРТА', 'АПРЕЛЯ', 'МАЯ', 'ИЮНЯ', 'ИЮЛЯ', 'АВГУСТА', 'СЕНТЯБРЯ', 'ОКТЯБРЯ', 'НОЯБРЯ', 'ДЕКАБРЯ'];

  const parseDateParts = (rawDate: string | undefined): { day: number; month: number } => {
    const normalized = (rawDate || '').trim();
    if (!normalized) {
      return { day: 0, month: 0 };
    }

    const dotFormat = normalized.match(/^(\d{1,2})\.(\d{1,2})\.\d{4}$/);
    if (dotFormat) {
      return {
        day: parseInt(dotFormat[1], 10),
        month: parseInt(dotFormat[2], 10),
      };
    }

    const isoFormat = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoFormat) {
      return {
        day: parseInt(isoFormat[3], 10),
        month: parseInt(isoFormat[2], 10),
      };
    }

    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        day: parsed.getDate(),
        month: parsed.getMonth() + 1,
      };
    }

    return { day: 0, month: 0 };
  };

  const extractEventsFromResponse = (payload: any): any[] => {
    if (Array.isArray(payload)) {
      return payload.flatMap((item) => (Array.isArray(item) ? item : [item]));
    }
    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.results)) return payload.results;
    }
    return [];
  };

  const normalizeFavoriteEvent = (item: any): Event | null => {
    const id = Number(item?.id);
    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }

    const slots = Array.isArray(item?.time_slots) ? item.time_slots : [];
    const firstSlot = slots[0] || null;
    const rawDate = firstSlot?.date_event
      || (Array.isArray(item?.date_event) ? item.date_event[0] : item?.date_event)
      || '';
    const rawTime = firstSlot?.start_time || item?.start_time || '';
    const { day, month } = parseDateParts(rawDate);

    return {
      id,
      name: String(item?.name || 'Без названия'),
      dateLabel: day > 0 ? String(day) : '—',
      monthLabel: month > 0 ? monthNames[month - 1] : 'ДАТА НЕ УКАЗАНА',
      timeLabel: formatTime(rawTime),
      price:
        item?.price !== null && item?.price !== undefined && !Number.isNaN(Number(item.price))
          ? Number(item.price)
          : null,
      location: String(item?.location || item?.address || item?.city || 'Адрес не указан'),
      picture_url: String(item?.picture_url || item?.pictures_main || item?.pictures_url || ''),
      age_limit: item?.age_limit ? String(item.age_limit) : null,
    };
  };

  const isOrganizer = role === 'organizator';
  const roleLabel = role === 'admin' ? 'Администратор' : isOrganizer ? 'Организатор' : 'Пользователь';
  const visibleUsername = useBreakpointValue({
    base: getTruncatedUsername(username || 'Логин'),
    lg: username || 'Логин',
  });
  const userInitial = (username?.trim()?.[0] || 'U').toUpperCase();

  return (
    <ContainerFluid>
      <Toaster />
      <Flex
        direction="column"
        align="center"
        justify="flex-start"
        fontFamily="Unbounded"
        gap={{ base: 8, lg: 10 }}
        py={{ base: 4, lg: 6 }}
      >
        <Box width="100%" maxW="1250px">
          <SimpleGrid columns={{ base: 1, lg: 4 }} gap={5}>
            <Box gridColumn={{ base: 'auto', lg: 'span 2' }}>
              <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <Box
                  borderRadius="3xl"
                  minH={{ base: '240px', lg: '280px' }}
                  p={{ base: 5, lg: 7 }}
                  position="relative"
                  overflow="hidden"
                  bg="linear-gradient(135deg, rgba(72, 105, 234, 0.92) 0%, rgba(50, 76, 178, 0.92) 100%)"
                  border="1px solid rgba(206, 223, 255, 0.35)"
                  boxShadow="0 20px 48px rgba(20, 34, 91, 0.45)"
                >
                  <Box
                    position="absolute"
                    top="-90px"
                    right="-80px"
                    w="220px"
                    h="220px"
                    borderRadius="full"
                    bg="rgba(255,255,255,0.16)"
                    filter="blur(10px)"
                  />
                  <Flex
                    direction={{ base: 'column', lg: 'row' }}
                    gap={{ base: 5, lg: 6 }}
                    position="relative"
                    zIndex={1}
                  >
                    <Box
                      flex={{ base: '1', lg: '0 0 45%' }}
                      borderRadius="2xl"
                      bg="rgba(255,255,255,0.10)"
                      border="1px solid rgba(255,255,255,0.26)"
                      p={{ base: 4, lg: 5 }}
                    >
                      <Text color="white" fontWeight="bold" fontSize={{ base: '20px', lg: '24px' }} mb={4}>
                        Личный кабинет
                      </Text>
                      <HStack align="center" gap={4}>
                        <Flex
                          w={{ base: '58px', lg: '70px' }}
                          h={{ base: '58px', lg: '70px' }}
                          borderRadius="full"
                          bg="rgba(255,255,255,0.22)"
                          border="1px solid rgba(255,255,255,0.34)"
                          color="white"
                          align="center"
                          justify="center"
                          fontWeight="bold"
                          fontSize={{ base: '22px', lg: '26px' }}
                          boxShadow="0 8px 24px rgba(10, 20, 61, 0.35)"
                        >
                          {userInitial}
                        </Flex>
                        <VStack align="start" gap={0}>
                          <Text color="white" fontSize={{ base: '24px', lg: '30px' }} fontWeight="bold" lineHeight="1.1">
                            {visibleUsername}
                          </Text>
                          <HStack gap={1.5} color="#D7E6FF">
                            <Icon as={FiUser} boxSize={3.5} />
                            <Text fontSize={{ base: '12px', lg: '13px' }}>
                              Профиль пользователя
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                    <Box
                      flex="1"
                      borderRadius="2xl"
                      bg="rgba(255,255,255,0.08)"
                      border="1px solid rgba(255,255,255,0.24)"
                      p={{ base: 4, lg: 5 }}
                    >
                      <Flex direction="column" h="100%">
                        <HStack
                          justify="space-between"
                          align={{ base: 'flex-start', md: 'center' }}
                          flexWrap="wrap"
                          gap={3}
                          mb={4}
                        >
                          <Badge
                            borderRadius="full"
                            px={3}
                            py={1}
                            color="white"
                            bg="rgba(255,255,255,0.18)"
                            border="1px solid rgba(255,255,255,0.34)"
                            fontWeight="semibold"
                          >
                            {roleLabel}
                          </Badge>
                          <HStack gap={2} color="#E6F0FF">
                            <Icon as={FiHeart} />
                            <Text fontSize={{ base: '14px', lg: '16px' }} fontWeight="semibold">
                              Избранных мероприятий: {events.length}
                            </Text>
                          </HStack>
                        </HStack>
                        <Text color="#D6E4FF" fontSize={{ base: '13px', lg: '14px' }} mb={4}>
                          Управляйте личными данными, настройками и вашим списком избранного в одном месте.
                        </Text>
                        <Button
                          mt="auto"
                          alignSelf="flex-start"
                          bg="white"
                          color="#3F5DD2"
                          borderRadius="xl"
                          px={6}
                          _hover={{ bg: '#dfe8ff', transform: 'translateY(-1px)' }}
                          transition="all .2s ease"
                          onClick={openEditingModal}
                        >
                          <HStack gap={2}>
                            <Icon as={FiSettings} />
                            <Text>Настройки</Text>
                          </HStack>
                        </Button>
                      </Flex>
                    </Box>
                  </Flex>
                </Box>
              </motion.div>
            </Box>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}>
              <Box
                borderRadius="3xl"
                minH={{ base: '220px', lg: '270px' }}
                p={{ base: 5, lg: 7 }}
                position="relative"
                bg="rgba(35, 56, 143, 0.80)"
                border="1px solid rgba(198, 219, 255, 0.28)"
                backdropFilter="blur(10px)"
                boxShadow="0 20px 48px rgba(15, 22, 58, 0.40)"
              >
                <VStack align="start" gap={5}>
                  <HStack gap={2} color="white">
                    <Icon as={FiStar} boxSize={5} color="#CFE1FF" />
                    <Text fontSize={{ base: '18px', lg: '22px' }} fontWeight="bold">Мои предпочтения</Text>
                  </HStack>
                  <Flex wrap="wrap" gap={3}>
                    {categories && categories.length > 0 ? (
                      categories.map((preference, index) => (
                        <Box
                          key={index}
                          px={4}
                          py={2}
                          borderRadius="full"
                          color="white"
                          fontSize={{ base: '12px', lg: '14px' }}
                          fontWeight="semibold"
                          bg="rgba(163, 188, 255, 0.24)"
                          border="1px solid rgba(214, 228, 255, 0.45)"
                          boxShadow="0 0 0 1px rgba(255,255,255,0.05) inset"
                          _hover={{ bg: 'rgba(185, 206, 255, 0.34)' }}
                          transition="all .2s ease"
                        >
                          {getPreferenceText(Number(preference))}
                        </Box>
                      ))
                    ) : (
                      <Text color="#E4EDFF" fontSize={{ base: '13px', lg: '15px' }} lineHeight={1.6}>
                        Пока нет выбранных предпочтений. Нажмите «Изменить», чтобы собрать персональную ленту.
                      </Text>
                    )}
                  </Flex>
                  <Button
                    mt="auto"
                    bg="white"
                    color="#3F5DD2"
                    borderRadius="xl"
                    _hover={{ bg: '#dfe8ff', transform: 'translateY(-1px)' }}
                    transition="all .2s ease"
                    onClick={openCategoriesModal}
                  >
                    Изменить
                  </Button>
                </VStack>
              </Box>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.16 }}>
              <Box
                borderRadius="3xl"
                minH={{ base: '220px', lg: '270px' }}
                p={{ base: 5, lg: 7 }}
                bg="linear-gradient(145deg, rgba(79, 106, 224, 0.90) 0%, rgba(58, 84, 192, 0.86) 100%)"
                border="1px solid rgba(205, 222, 255, 0.30)"
                position="relative"
                overflow="hidden"
                boxShadow="0 20px 44px rgba(21, 31, 84, 0.36)"
              >
                <VStack gap={5} justify="center" align="center" h="100%" userSelect="none">
                  <Image
                    src={comp}
                    alt="Component"
                    height={{ base: '104px', lg: '132px' }}
                    width={{ base: '164px', lg: '212px' }}
                    objectFit="cover"
                    pointerEvents="none"
                  />
                  <Button
                    borderRadius="xl"
                    bg="white"
                    color="#3F5DD2"
                    px={6}
                    py={6}
                    whiteSpace="normal"
                    fontWeight="bold"
                    fontSize={{ base: '14px', lg: '16px' }}
                    _hover={{ bg: '#dfe8ff', transform: 'translateY(-2px)' }}
                    transition="all .2s ease"
                    onClick={isOrganizer ? openModal : openOrganizerRegisterModal}
                  >
                    {isOrganizer ? 'Создать мероприятие' : 'Стать организатором'}
                  </Button>
                </VStack>
              </Box>
            </motion.div>
          </SimpleGrid>
        </Box>
        <Box width="100%" maxW="1250px">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }}>
            <Flex
              justify="space-between"
              align={{ base: 'flex-start', md: 'center' }}
              direction={{ base: 'column', md: 'row' }}
              mb={6}
              gap={4}
            >
              <VStack gap={1} align="start">
                <Text
                  fontSize={{ base: '29px', md: '44px' }}
                  fontWeight="bold"
                  bgGradient="linear(to-r, #ffffff, #cbdbff)"
                  bgClip="text"
                  userSelect="none"
                  lineHeight="1.05"
                >
                  Мои избранные мероприятия
                </Text>
                <Text color="#D5E2FF" fontSize={{ base: '13px', md: '15px' }}>
                  Все события, которые вы отметили как интересные
                </Text>
              </VStack>
              <Badge
                borderRadius="full"
                bg="rgba(95, 130, 255, 0.30)"
                border="1px solid rgba(205, 224, 255, 0.36)"
                color="#EEF4FF"
                px={4}
                py={2}
                fontSize={{ base: '12px', md: '13px' }}
              >
                {events.length} в избранном
              </Badge>
            </Flex>
          </motion.div>
          {events.length > 0 ? (
            <VStack gap={5} align="stretch" userSelect="none" mb={3}>
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.03 * index }}
                  whileHover={{ y: -3 }}
                >
                  <Box
                    bg="linear-gradient(135deg, rgba(21, 35, 95, 0.88) 0%, rgba(34, 53, 132, 0.86) 100%)"
                    border="1px solid rgba(193, 214, 255, 0.30)"
                    borderRadius="3xl"
                    p={{ base: 4, md: 6 }}
                    boxShadow="0 20px 45px rgba(8, 14, 40, 0.40)"
                    transition="all .2s ease"
                  >
                    <Flex gap={5} direction={{ base: 'column', md: 'row' }}>
                      <Box position="relative" flexShrink={0} alignSelf={{ base: 'center', md: 'stretch' }}>
                        <Image
                          src={event.picture_url || EventImage}
                          alt={event.name}
                          height={{ base: '240px', md: '210px' }}
                          width={{ base: '190px', md: '145px' }}
                          pointerEvents="none"
                          borderRadius="2xl"
                          objectFit="cover"
                          border="1px solid rgba(255,255,255,0.28)"
                          boxShadow="0 16px 30px rgba(10, 18, 54, 0.45)"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = EventImage;
                          }}
                        />
                        <Badge
                          position="absolute"
                          top={3}
                          left={3}
                          borderRadius="full"
                          px={3}
                          py={1}
                          bg="rgba(15, 27, 76, 0.74)"
                          border="1px solid rgba(196, 219, 255, 0.38)"
                          color="#ddecff"
                          fontWeight="semibold"
                        >
                          {formatAgeLimit(event.age_limit)}
                        </Badge>
                      </Box>
                      <VStack align="stretch" gap={4} flex="1">
                        <Flex
                          align={{ base: 'flex-start', lg: 'center' }}
                          justify="space-between"
                          direction={{ base: 'column', lg: 'row' }}
                          gap={3}
                        >
                          <Text
                            fontSize={{ base: '22px', md: '28px' }}
                            color="white"
                            fontWeight="bold"
                            lineHeight="1.18"
                            style={{
                              display: '-webkit-box',
                              overflow: 'hidden',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 2,
                            }}
                          >
                            {event.name}
                          </Text>
                          <Badge
                            alignSelf={{ base: 'flex-start', lg: 'center' }}
                            borderRadius="full"
                            px={3}
                            py={2}
                            bg="rgba(173, 198, 255, 0.20)"
                            color="#EAF2FF"
                            border="1px solid rgba(205, 223, 255, 0.36)"
                            fontWeight="semibold"
                          >
                            {formatPrice(event.price)}
                          </Badge>
                        </Flex>
                        <HStack gap={3} flexWrap="wrap" color="#DDEAFF" fontSize={{ base: '13px', md: '14px' }}>
                          <Badge borderRadius="full" px={3} py={1.5} bg="rgba(255,255,255,0.12)" color="#E7F0FF">
                            {event.dateLabel} {event.monthLabel}
                          </Badge>
                          <Badge borderRadius="full" px={3} py={1.5} bg="rgba(255,255,255,0.12)" color="#E7F0FF">
                            {event.timeLabel}
                          </Badge>
                          <HStack gap={1} bg="rgba(255,255,255,0.12)" borderRadius="full" px={3} py={1.5}>
                            <Icon as={FiMapPin} />
                            <Text
                              style={{
                                display: '-webkit-box',
                                overflow: 'hidden',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 1,
                              }}
                            >
                              {event.location}
                            </Text>
                          </HStack>
                        </HStack>
                        <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
                          <Text color="#D0E0FF" fontSize={{ base: '13px', md: '14px' }}>
                            Нажмите, чтобы открыть подробную страницу мероприятия
                          </Text>
                          <Button
                            borderRadius="xl"
                            bg="rgba(255,255,255,0.16)"
                            color="white"
                            border="1px solid rgba(255,255,255,0.35)"
                            _hover={{ bg: 'rgba(255,255,255,0.28)' }}
                            onClick={() => navigate(`/event/${event.id}`)}
                          >
                            Открыть мероприятие
                          </Button>
                        </Flex>
                      </VStack>
                    </Flex>
                  </Box>
                </motion.div>
              ))}
            </VStack>
          ) : (
            <Box
              borderRadius="3xl"
              bg="rgba(31, 47, 120, 0.70)"
              border="1px solid rgba(199, 218, 255, 0.30)"
              p={{ base: 6, md: 10 }}
              textAlign="center"
            >
              <VStack gap={3}>
                <Icon as={FiCalendar} boxSize={8} color="#d9e7ff" />
                <Text color="white" fontSize={{ base: '18px', md: '27px' }} fontWeight="bold">
                  Пока нет избранных мероприятий
                </Text>
                <Text color="#D5E3FF" fontSize={{ base: '13px', md: '15px' }}>
                  Добавьте интересные события из ленты — они появятся здесь.
                </Text>
              </VStack>
            </Box>
          )}
        </Box>
        {isOrganizer ? (
          <Box width="100%" maxW="1250px" mt={2}>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
              <Box
                borderRadius="3xl"
                bg="rgba(26, 40, 107, 0.68)"
                border="1px solid rgba(194, 214, 255, 0.28)"
                p={{ base: 4, md: 6 }}
                mb={4}
              >
                <Text
                  fontSize={{ "2xl": "50px", lg: "40px", md: "30px", base: "24px" }}
                  color="white"
                  fontWeight="bold"
                  textAlign={{ base: 'left', md: 'center' }}
                  mb={2}
                >
                  План ваших мероприятий
                </Text>
                <Text color="#D6E5FF" fontSize={{ base: '13px', md: '15px' }} textAlign={{ base: 'left', md: 'center' }}>
                  Календарь поможет управлять расписанием и быстро создавать новые события.
                </Text>
              </Box>
            </motion.div>
            <Calendar canManageEvents={isOrganizer} />
          </Box>
        ) : null}
        <CreateModal isOpen={isModalOpen} onRequestClose={closeModal} onCreateSuccess={handleCreateSuccess} />
        <CategoriesModal isOpen={isCategoriesModalOpen} onRequestClose={closeCategoriesModal} />
        <EditingModal
          isOpen={isEditingModalOpen}
          onRequestClose={closeEditingModal}
          onCreateSuccess={handleCreateSuccess}
        />
        <OrganizerRegisterModal
          isOpen={isOrganizerRegisterOpen}
          onRequestClose={closeOrganizerRegisterModal}
          openLoginModal={() => {}}
        />
      </Flex>
    </ContainerFluid>
  );
};

export default Account;