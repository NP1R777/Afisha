import { Box, Flex, Image, Button, Text, useBreakpointValue } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../addition/context';
import comp from '../pictures/comp.png';
import EditingModal from '../modal/editing';
import CreateModal from '../pages/creature';
import CategoriesModal from '../pages/categories';
import com from '../pictures/comp2.png';
import com2 from '../pictures/settings.png';
import axios from '../shared/lib/axios';
import { ContainerFluid } from '../components/ui/container';
import { Toaster, toaster } from "../components/ui/toaster"
import { Calendar } from '../modal/org_calendar';
import OrganizerRegisterModal from '../modal/org_registration';
import EventImage from '../pictures/picture1.png';

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

  const imageSrc = useBreakpointValue({ base: com2, lg: com });

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

  return (
    <ContainerFluid>
      <Toaster />
      <Flex
        direction="column"
        align={{ base: 'start', lg: 'center' }}
        justify={{ base: 'start', lg: 'center' }}
        fontFamily="Unbounded"
      >
        <Box overflowX="auto" width="100%" display="grid" gridTemplateColumns="min-content auto min-content" gap={4}>
          <Box
            bg="#6B84EA"
            borderRadius="xl"
            height={{ base: '200px', lg: '260px' }}
            width={{ base: '170px', lg: '250px' }}
            userSelect="none"
            fontWeight="semibold"
            position="relative"
            p={{ base: '1', lg: '9' }}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
          >
            <Image
              src={imageSrc}
              alt="cloud"
              width={{ base: '41%', lg: '90%' }}
              height={{ base: '30%', lg: '90%' }}
              objectFit="cover"
              pointerEvents="none"
              mb={{ base: '3', lg: '1' }}
            />
            <Text fontSize={{ base: '17px', lg: '20px' }} color="white" mb={2}>
              {useBreakpointValue({
                base: getTruncatedUsername(username || 'Логин'),
                lg: username || 'Логин',
              })}
            </Text>
            <Button
              bg="white"
              color="#6B84EA"
              size="md"
              borderRadius="xl"
              _hover={{ bg: '#4C6BE6', color: 'white' }}
              onClick={openEditingModal}
            >
              Настройки
            </Button>
          </Box>
          <Box
            bg="#6B84EA"
            borderRadius="xl"
            height={{ base: '200px', lg: '260px' }}
            minWidth="400px"
            position="relative"
            p={4}
            userSelect="none"
            fontWeight="semibold"
          >
            <Box
              bg="white"
              borderRadius="xl"
              color="#A3B3F2"
              height={{ base: '40px', lg: '50px' }}
              width={{ base: '220px', lg: '250px' }}
              fontSize={{ base: '16px', lg: '18px' }}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <p>Мои предпочтения</p>
            </Box>
            <Flex wrap="wrap" gap={4} mt={4}>
              {categories && categories.length > 0 ? (
                categories.map((preference, index) => (
                  <Box
                    key={index}
                    bg="#A3B3F2"
                    borderRadius="xl"
                    color="white"
                    height={{ base: '35px', lg: '40px' }}
                    width="auto"
                    fontSize={{ base: '13px', lg: '20px' }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    px={4}
                  >
                    <p>{getPreferenceText(Number(preference))}</p>
                  </Box>
                ))
              ) : (
                <Text color="white" fontSize={{ base: '13px', sm:"13px", lg: '17px', xl: '22px' }} textAlign="center" width="100%">
                  У вас пока нет выбранных предпочтений. Нажмите кнопку "Изменить", чтобы выбрать понравившиеся
                  категории.
                </Text>
              )}
            </Flex>
            <Button
              bg="white"
              color="#6B84EA"
              size="md"
              borderRadius="xl"
              position="absolute"
              onClick={openCategoriesModal}
              bottom="26px"
              right="26px"
              _hover={{
                bg: '#4C6BE6',
                color: 'white',
              }}
            >
              Изменить
            </Button>
          </Box>
          <Box
            bg="#6B84EA"
            borderRadius="xl"
            height={{ base: '200px', lg: '260px' }}
            width={{ base: '210px', lg: '250px' }}
          >
            <Flex direction="column" align="center" justify="center" height="100%" gap={4} userSelect="none">
              <Image
                src={comp}
                alt="Component"
                height={{ base: '100px', lg: '130px' }}
                width={{ base: '160px', lg: '220px' }}
                objectFit="cover"
                pointerEvents="none"
              />
              <Button
                borderRadius="xl"
                bg="white"
                color="#6B84EA"
                height={{ base: '45px', lg: '60px' }}
                width={{ base: '160px', lg: '190px' }}
                whiteSpace="normal"
                fontWeight="semibold"
                fontSize={{ base: '15px', lg: '17px' }}
                _hover={{
                  bg: '#4C6BE6',
                  color: 'white',
                }}
                onClick={isOrganizer ? openModal : openOrganizerRegisterModal}
              >
                {isOrganizer ? 'Создать мероприятие' : 'Стать организатором'}
              </Button>
            </Flex>
          </Box>
        </Box>
        <Box width="100%" mt={15}>
          <Flex direction="column" align="center">
            <Text fontSize={{ base: '24px', md: '49px' }} color="white" fontWeight="bold" userSelect="none" mb={6}>
              Мои избранные мероприятия
            </Text>
            {events.length > 0 ? (
              <Flex
                direction={{ base: 'row', md: 'column' }}
                gap={7}
                userSelect="none"
                mb={9}
                overflowX="auto"
                overflowY="hidden"
                width="100%"
                align="center"
              >
                {events.map((event) => (
                  <Flex key={event.id} userSelect="none" direction={{ base: 'column', md: 'row' }} w="100%" maxW={{ md: '980px', xl: '1100px' }}>
                    <Box
                      bg="rgba(24, 37, 104, 0.78)"
                      border="1px solid rgba(200, 220, 255, 0.24)"
                      borderRadius="2xl"
                      height={{ base: 'auto', md: '250px' }}
                      width={{ base: '100%', md: 'calc(100% - 145px)' }}
                      p={{ base: 4, md: 6 }}
                      color="white"
                      fontWeight="semibold"
                      position="relative"
                      boxShadow="0 12px 30px rgba(8, 12, 30, 0.32)"
                      transition="all .2s ease"
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: '0 16px 34px rgba(8, 12, 30, 0.42)',
                      }}
                    >
                      <Flex direction={{ base: 'column', md: 'row' }} align="center" height="100%" gap={4}>
                        <Image
                          src={event.picture_url || EventImage}
                          alt={event.name}
                          height={{ base: '260px', md: '195px' }}
                          width={{ base: '180px', md: '130px' }}
                          pointerEvents="none"
                          borderRadius={{ base: 'lg', md: 'xl' }}
                          objectFit="cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = EventImage;
                          }}
                        />
                        <Flex direction="column" justify="space-between" flex="1" height="100%">
                          <Flex
                            justify="space-between"
                            align="stretch"
                            direction={{ base: 'column', md: 'row' }}
                            width="100%"
                          >
                            <Text
                              fontSize={{ base: '20px', md: '20px', lg: '27px' }}
                              textAlign={{ base: 'center', md: 'left' }}
                              alignSelf={{ base: 'center', md: 'flex-start' }}
                              style={{
                                display: '-webkit-box',
                                overflow: 'hidden',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 3,
                              }}
                            >
                              {event.name}
                            </Text>
                            <Text
                              fontSize={{ base: '13px', md: '12px', lg: '15px' }}
                              textAlign={{ base: 'center', md: 'left' }}
                              alignSelf={{ base: 'center', md: 'flex-start' }}
                              maxW={{ base: '80%', md: '250px' }}
                              style={{
                                display: '-webkit-box',
                                overflow: 'hidden',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 3,
                              }}
                              display="flex"
                              alignItems="flex-start"
                              mt={{ base: 2, md: 1, lg: 2 }}
                            >
                              {event.location}
                            </Text>
                          </Flex>
                          <Flex
                            justify="space-between"
                            align={{ base: 'center', md: 'flex-end' }}
                            direction={{ base: 'column', md: 'row' }}
                            mt={{ base: 4, md: 0 }}
                          >
                            <Flex align="center">
                              <Text fontSize="50px" mr={1}>
                                {event.dateLabel}
                              </Text>
                              <Text fontSize="15px" color="#A5C0FF">
                                {event.monthLabel}
                              </Text>
                            </Flex>
                            <Flex mt={5}>
                              <Text fontSize="20px" textAlign="center" mb={2}>
                                {event.timeLabel}
                              </Text>
                              <Text
                                fontSize="14px"
                                textAlign="right"
                                ml={{ base: 10, md: 20, lg: 40 }}
                                mb={5}
                                mt={{ base: 1, md: 1 }}
                              >
                                {formatAgeLimit(event.age_limit)} · {formatPrice(event.price)}
                              </Text>
                            </Flex>
                          </Flex>
                        </Flex>
                      </Flex>
                      <Button
                        position="absolute"
                        bottom={{ base: 3, md: 4 }}
                        right={{ base: 3, md: 4 }}
                        size="sm"
                        borderRadius="full"
                        bg="rgba(255,255,255,0.16)"
                        color="white"
                        border="1px solid rgba(255,255,255,0.32)"
                        _hover={{ bg: 'rgba(255,255,255,0.26)' }}
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        Открыть
                      </Button>
                    </Box>
                    <Box
                      bg="rgba(64, 92, 200, 0.78)"
                      border="1px solid rgba(200, 220, 255, 0.24)"
                      borderRadius="2xl"
                      height={{ base: '160px', md: '250px' }}
                      width={{ base: '100%', md: '145px' }}
                      p={7}
                      color="white"
                      fontWeight="semibold"
                    >
                      <Flex
                        align="center"
                        justify="center"
                        height="100%"
                      >
                        <Text fontSize={{ base: '18px', md: '15px' }} textAlign="center" lineHeight={1.4}>
                          {formatPrice(event.price)}
                        </Text>
                      </Flex>
                    </Box>
                  </Flex>
                ))}
              </Flex>
            ) : (
              <Text
                color="white"
                fontSize={{ base: '15px', md: '30px' }}
                textAlign="center"
                width={{ base: '80%', md: '100%' }}
                mb={6}
              >
                У вас пока нет избранных мероприятий.
              </Text>
            )}
          </Flex>
        </Box>
        {isOrganizer ? (
          <Box width="100%" mt={15}>
            <Text
              fontSize={{ "2xl": "50px", lg: "40px", md: "30px", base: "20px" }}
              color="white"
              fontWeight="bold"
              mt="40px"
              ml="55px"
              textAlign="center"
            >
              План ваших мероприятий
            </Text>
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