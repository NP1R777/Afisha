import { Button, Flex, Heading, HStack, Image, Separator, Stack, Text, VStack, Box } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../addition/context';
import LoginModal from '../pages/authorization';
import RegisterModal from '../pages/registration';
import fon from '../pictures/fon2.png';
import axios from '../shared/lib/axios';
import { Toaster, toaster } from "../components/ui/toaster"
import EventImage from '../pictures/picture1.png';
import star_empty from '../pictures/star1.png';
import star_full from '../pictures/Star2.png';

interface EventDetails {
  id: number;
  name: string;
  description: string;
  organization: number;
  group_id: string;
  external_url: string;
  date_event: string[];
  duration: string;
  price: number | null;
  address: string;
  city: string;
  age_limit: string;
  pictures_main: string;
  pictures_two: string | null;
  time_slots: {
    id?: number;
    event_id?: number;
    date_event: string;
    start_time: string;
  }[];
}

const Events = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const { userId, setUsername } = useUser();
  const navigate = useNavigate();
  const monthNames = ['ЯНВАРЯ', 'ФЕВРАЛЯ', 'МАРТА', 'АПРЕЛЯ', 'МАЯ', 'ИЮНЯ', 'ИЮЛЯ', 'АВГУСТА', 'СЕНТЯБРЯ', 'ОКТЯБРЯ', 'НОЯБРЯ', 'ДЕКАБРЯ'];
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [favorites, setFavorites] = useState<{ [key: number]: boolean }>({});
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const districtMap: Record<string, string> = {
      norilsk: 'Норильск',
      talnah: 'Талнах',
      kayerkan: 'Кайеркан',
      oganeer: 'Оганер',
      dudinka: 'Дудинка',
    };

  const formatScheduleValue = (rawValue?: string) => {
  return rawValue?.slice(0, 5) || '—';
};

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

  const formatPrice = (rawPrice: number | null): string => {
    if (rawPrice === null || Number.isNaN(rawPrice)) {
      return '';
    }

    if (rawPrice === 0) {
      return 'Бесплатно';
    }

    return `от ${rawPrice} ₽`;
  };

  const formatDescriptionParagraphs = (rawDescription: string): string[] => {
    const normalized = (rawDescription || '').replace(/\r/g, '').trim();
    if (!normalized) {
      return ['Описание пока не добавлено.'];
    }

    const byBlocks = normalized
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);

    if (byBlocks.length > 1) {
      return byBlocks;
    }

    const bySentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    if (bySentences.length <= 2) {
      return [normalized];
    }

    const grouped: string[] = [];
    for (let index = 0; index < bySentences.length; index += 2) {
      grouped.push(bySentences.slice(index, index + 2).join(' '));
    }

    return grouped;
  };

  const organizationsMap: Record<number, string> = {
    1: 'Заполярный театр драмы',
    2: 'Администрация города Норильска',
    3: 'Кинотеатр Родина',
    4: 'Городской центр культуры',
    5: 'Талнахская детская школа искусств',
    6: 'Норильская детская школа искусств',
    7: 'Норильский колледж искусств',
    8: 'Афиша Северного города',
    9: 'Культурно-досуговый центр имени В. Высоцкого',
  };

  const toggleFavorite = async (index: number) => {
    if (!userId) {
      setIsLoginOpen(true);
      return;
    }

    const parsedEventId = Number(eventId);
    if (!Number.isInteger(parsedEventId) || parsedEventId <= 0) {
      toaster.error({
        title: 'Некорректный идентификатор мероприятия',
        duration: 3000,
      });
      return;
    }

    try {
      const response = await axios.patch(
        `/user/add_like_events`,
        null,
        {
          params: {
            user_id: userId,
            event_id: parsedEventId,
          },
        }
      );

      if (response.status === 200) {
        setFavorites((prev) => ({
          ...prev,
          [index]: true,
        }));

        toaster.success({
          title: 'Мероприятие добавлено в избранное',
          duration: 3000,
        });
      }

    } catch (error: any) {

      if (error.response?.status === 409) {

        toaster.create({
          title: 'Мероприятие уже добавлено в избранное.',
          description:
            'Чтобы посмотреть все избранные мероприятия, перейдите в аккаунт пользователя',
          duration: 4000,
        });

        return;
      }

      console.error(
        'Ошибка добавления в избранное:',
        error
      );

      toaster.error({
        title: 'Ошибка добавления в избранное',
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    const fetchFavorites = async () => {

      if (!userId || !eventId) return;

      try {

        const response = await axios.get(
          `/user/get_like_events?user_id=${userId}`
        );

        const data = response.data;

        const flattenedEvents = Array.isArray(data[0])
          ? data.flat()
          : data;

        const isFavorite = flattenedEvents.some(
          (event: any) => String(event.id) === String(eventId)
        );

        if (isFavorite) {
          setFavorites({
            0: true,
          });
        }

      } catch (error) {
        console.error(
          'Ошибка загрузки избранных мероприятий:',
          error
        );
      }
    };

    fetchFavorites();

  }, [userId, eventId]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      const parsedEventId = Number(eventId);
      if (!Number.isInteger(parsedEventId) || parsedEventId <= 0) {
        toaster.error({
          title: 'Некорректная ссылка на мероприятие',
          duration: 3000,
        });
        navigate('/');
        return;
      }

      try {

        const response = await axios.get(
          `/event/${parsedEventId}`
        );

        console.log('EVENT DETAILS:', response.data);

        const data = response.data;
        const normalizedTimeSlots = Array.isArray(data.time_slots)
          ? data.time_slots
          : [];
        const legacyDates = Array.isArray(data.date_event)
          ? data.date_event
          : data.date_event
            ? [data.date_event]
            : [];

        const normalizedEvent: EventDetails = {
          ...data,
          description: data.description || '',
          city: data.city || '',
          address: data.address || '',
          price:
            data.price !== null && data.price !== undefined && !Number.isNaN(Number(data.price))
              ? Number(data.price)
              : null,

          picture_url:
            data.picture_url ||
            data.pictures_main ||
            data.pictures_url ||
            '',

          horizontal_picture_url:
            data.horizontal_picture_url ||
            data.pictures_two ||
            '',

          group_id: String(
            data.group_id ??
            data.group_ids?.[0] ??
            ''
          ),

          location:
            data.location ||
            data.address ||
            data.city ||
            '',

          date_event: normalizedTimeSlots.length
            ? normalizedTimeSlots.map((slot: { date_event: string }) => slot.date_event)
            : legacyDates,

          duration: data.duration || data.start_time || '',

          time_slots: normalizedTimeSlots,
        };

        setEventDetails(normalizedEvent);

      } catch (error) {
        console.error(
          'Ошибка загрузки мероприятия:',
          error
        );
        toaster.error({
          title: 'Не удалось загрузить мероприятие',
          duration: 3000,
        });
      }
    };

    if (eventId) {
      fetchEventDetails();
    }

  }, [eventId]);

  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [eventId]);

  if (!eventDetails) {
    return <Text>Loading...</Text>;
  }

  const handleLoginSuccess = () => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  };

  const handleBookTicket = () => {
    if (!eventDetails.external_url) {
      toaster.error({
        title: 'Ссылка на покупку билета отсутствует',
        duration: 3000,
      });

      return;
    }

    window.open(eventDetails.external_url, '_blank');
  };

  const normalizedAgeLimit = (eventDetails.age_limit || '').trim();
  const formattedAgeLimit = normalizedAgeLimit
    ? normalizedAgeLimit.endsWith('+')
      ? normalizedAgeLimit
      : `${normalizedAgeLimit}+`
    : '0+';
  const formattedPrice = formatPrice(eventDetails.price);
  const sectionAnimation = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: 'easeOut' as const },
  };

  const scheduleRows = (eventDetails.time_slots || []).map((slot) => {
    const { day, month } = parseDateParts(slot.date_event);
    const slotTime = formatScheduleValue(slot.start_time);
    const timeLabel =
      slotTime !== '—' && slotTime !== '00:00'
        ? slotTime
        : 'Время начала не указано';

    return {
      day,
      month,
      timeLabel,
    };
  });
  const descriptionParagraphs = formatDescriptionParagraphs(eventDetails.description || '');
  const descriptionPreviewLimit = 3;
  const hasLongDescription = descriptionParagraphs.length > descriptionPreviewLimit;
  const visibleDescriptionParagraphs = isDescriptionExpanded
    ? descriptionParagraphs
    : descriptionParagraphs.slice(0, descriptionPreviewLimit);

  const openLoginModal = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegisterModal = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  return (
    <Flex w="100%">
      <LoginModal
        isOpen={isLoginOpen}
        onRequestClose={() => setIsLoginOpen(false)}
        openRegisterModal={openRegisterModal}
        onLoginSuccess={handleLoginSuccess}
      />
      <Toaster />
      <RegisterModal isOpen={isRegisterOpen} onRequestClose={() => setIsRegisterOpen(false)} openLoginModal={openLoginModal} />

      {eventDetails.pictures_two && (
        <Box position="absolute" top={0} left={0} width="100%" height='100%' maxWidth="1960px"
        >
          <Image
            src={eventDetails. pictures_two}
            alt="Изображение мероприятия"
            objectFit="cover"
            objectPosition="top center"
            width="100%"
            height={{ base: '275px', sm: "320px", md: '430px', lg: '430px', xl: '540px', "2xl": '735px' }}
            position="absolute"
            top={0}
            left={0}
            zIndex={0}
            onError={(e) => {
              const parentBox = e.currentTarget.parentElement;
              if (parentBox) parentBox.style.display = 'none';
            }}
          />
          <Image
            src={fon}
            alt="Overlay Image"
            objectFit="cover"
            width="100%"
            height={{ base: '275px', sm: "320px", md: '430px', lg: '430px', xl: '540px', "2xl": '735px' }}
            position="absolute"
            top={0}
            left={0}
            zIndex={1}
          />
        </Box>
      )}
      <Box
        width="100%"
        maxW="1960px"
        px={{ base: 5, sm: 6, md: 10, lg: 16, xl: 24, "2xl": 100 }}
        mx="auto"
        zIndex={1}
        fontFamily="Unbounded"
        userSelect="none"
      >
        <motion.div {...sectionAnimation}>
          <Flex
            wrap="nowrap"
            mt={{ "2xl": 25, xl: 16, base: 8 }}
            align="flex-end"
            gap={{ base: 3, md: 6, xl: 8 }}
          >
            <VStack
              w={{ "2xl": '380px', xl: '300px', lg: '230px', md: "210px", sm: "155px", base: "115px" }}
              align="stretch"
              flexShrink={0}
            >
              <Image
                src={eventDetails.pictures_main}
                alt={eventDetails.name}
                objectFit="cover"
                width="100%"
                height={{ "2xl": '550px', xl: '430px', md: '330px', sm: '235px', base: '170px' }}
                borderRadius="14px"
                boxShadow="0 22px 54px rgba(8, 12, 38, 0.45)"
                transition="transform 0.28s ease, box-shadow 0.28s ease"
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: '0 26px 60px rgba(8, 12, 38, 0.55)',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = EventImage;
                }}
              />
            </VStack>

            <VStack
              align="start"
              gap={{ base: 2, md: 4 }}
              justifyContent="flex-end"
              height="full"
              bg="rgba(18, 22, 52, 0.48)"
              border="1px solid rgba(255,255,255,0.2)"
              borderRadius="20px"
              px={{ base: 3, md: 6 }}
              py={{ base: 3, md: 5 }}
              backdropFilter="blur(6px)"
            >
              <Heading
                as="h1"
                color="white"
                fontSize={{ "2xl": '62px', lg: '46px', md: "34px", sm: "24px", base: "20px" }}
                fontWeight="700"
                fontFamily="Unbounded"
                lineHeight={{ base: 1.15, md: 1.08 }}
                textAlign="start"
                maxWidth={{ "2xl": '860px', lg: '560px', md: "450px", sm: "340px", base: "230px" }}
                style={{
                  textShadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
                  display: '-webkit-box',
                  overflow: 'hidden',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {eventDetails.name}
              </Heading>

              <HStack gap={2} flexWrap="wrap">
                <Box
                  bg="rgba(255,255,255,0.14)"
                  border="1px solid rgba(255,255,255,0.28)"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  <Text color="white" fontSize={{ base: '10px', md: '13px', lg: '15px' }}>
                    {formattedAgeLimit}
                  </Text>
                </Box>
                {formattedPrice && (
                  <Box
                    bg="rgba(138, 174, 255, 0.25)"
                    border="1px solid rgba(199,220,255,0.4)"
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    <Text color="white" fontSize={{ base: '10px', md: '13px', lg: '15px' }}>
                      {formattedPrice}
                    </Text>
                  </Box>
                )}
                {eventDetails.duration ? (
                  <Box
                    bg="rgba(255,255,255,0.10)"
                    border="1px solid rgba(255,255,255,0.2)"
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    <Text color="white" fontSize={{ base: '10px', md: '13px', lg: '15px' }}>
                      {eventDetails.duration}
                    </Text>
                  </Box>
                ) : null}
              </HStack>
            </VStack>
          </Flex>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
        >
          <Box
            mt={{ base: 6, md: 10 }}
            bg="rgba(16, 22, 56, 0.52)"
            border="1px solid rgba(255,255,255,0.2)"
            borderRadius="22px"
            p={{ base: 3, md: 6 }}
            backdropFilter="blur(6px)"
          >
            <Stack>
              <Text
                fontSize={{ "2xl": '46px', lg: '36px', md: "30px", base: "24px" }}
                color="white"
                fontWeight="700"
              >
                Расписание
              </Text>
              <Separator mt={1} borderColor="rgba(255,255,255,0.35)" />
            </Stack>

            <VStack align="stretch" mt={4} gap={3} w="100%">
              {scheduleRows.length === 0 ? (
                <Text color="white" fontSize={{ lg: '18px', md: "16px", base: "14px" }}>
                  Время начала не указано
                </Text>
              ) : scheduleRows.map((d, index) => (
                <Box
                  key={`${d.day}-${d.month}-${index}`}
                  w="100%"
                  bg="rgba(255,255,255,0.08)"
                  border="1px solid rgba(255,255,255,0.16)"
                  borderRadius="14px"
                  p={{ base: 2.5, md: 3.5 }}
                  transition="all .22s ease"
                  _hover={{
                    bg: 'rgba(255,255,255,0.12)',
                    borderColor: 'rgba(170, 198, 255, 0.45)',
                    boxShadow: '0 10px 24px rgba(4, 8, 28, 0.35)',
                  }}
                >
                  <Flex
                    w="100%"
                    justify="space-between"
                    align={{ base: 'start', md: 'center' }}
                    direction={{ base: 'column', md: 'row' }}
                    gap={{ base: 3, md: 4 }}
                  >
                    <HStack gap="14px">
                      <Text
                        fontSize={{ "2xl": '56px', lg: '44px', md: "36px", base: "30px" }}
                        fontWeight="700"
                        color="white"
                        lineHeight={1}
                      >
                        {d.day}
                      </Text>
                      <Text
                        fontSize={{ "2xl": '24px', lg: '20px', md: "16px", base: "13px" }}
                        fontWeight="700"
                        color="#BFD4FF"
                        lineHeight={1.1}
                      >
                        {monthNames[d.month - 1] || '—'}
                      </Text>
                    </HStack>

                    <Text
                      color="white"
                      fontSize={{ "2xl": '24px', lg: '20px', md: '16px', base: '14px' }}
                      fontWeight="500"
                      textShadow="0 0 14px rgba(196, 219, 255, 0.45)"
                    >
                      {d.timeLabel}
                    </Text>

                    <HStack gap={{ base: 2, md: 3 }} align="center" ml={{ md: 'auto' }}>
                      <Box
                        as="button"
                        onClick={() => toggleFavorite(index)}
                        transition="all 0.2s ease"
                        _hover={{
                          transform: 'scale(1.08)',
                          filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.45))',
                        }}
                      >
                        <Image
                          src={favorites[index] ? star_full : star_empty}
                          alt="favorite"
                          boxSize={{ "2xl": "48px", xl: "46px", lg: "42px", md: "38px", sm: "32px", base: '30px' }}
                          objectFit="contain"
                        />
                      </Box>

                      <Button
                        bg="white"
                        color="black"
                        fontSize={{ "2xl": '22px', xl: '20px', md: "18px", lg: '18px', sm: "14px", base: '13px' }}
                        fontWeight="700"
                        px={{ "2xl": '34px', xl: '24px', md: "20px", base: '16px' }}
                        py={{ base: 4, md: 6 }}
                        borderRadius="xl"
                        boxShadow="0px 10px 26px rgba(114, 150, 204, 0.38)"
                        transition="all .22s ease"
                        _hover={{
                          bg: '#0F173E',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.35)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0px 14px 30px rgba(8, 12, 30, 0.48)',
                        }}
                        onClick={handleBookTicket}
                      >
                        Купить билет
                      </Button>
                    </HStack>
                  </Flex>
                </Box>
              ))}
            </VStack>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.46, ease: 'easeOut', delay: 0.14 }}
        >
          <Box
            mt={5}
            bg="rgba(17, 23, 58, 0.5)"
            border="1px solid rgba(255,255,255,0.2)"
            borderRadius="22px"
            p={{ base: 3, md: 6 }}
            backdropFilter="blur(6px)"
          >
            <Text fontSize={{ "2xl": '42px', lg: '34px', md: "28px", base: "22px" }} color="white" fontWeight="700">
              О событии
            </Text>
            <VStack align="stretch" gap={3} mt={3}>
              {visibleDescriptionParagraphs.map((paragraph, index) => (
                <Text
                  key={`desc-paragraph-${index}`}
                  fontSize={{ "2xl": '22px', lg: '18px', md: "16px", base: "14px" }}
                  color="white"
                  lineHeight={1.72}
                  whiteSpace="normal"
                >
                  {paragraph}
                </Text>
              ))}
              {hasLongDescription ? (
                <Button
                  alignSelf="flex-start"
                  mt={1}
                  bg="rgba(255,255,255,0.12)"
                  color="white"
                  border="1px solid rgba(255,255,255,0.28)"
                  borderRadius="full"
                  px={5}
                  py={2}
                  fontSize={{ base: '13px', md: '15px' }}
                  transition="all .2s ease"
                  _hover={{
                    bg: 'rgba(255,255,255,0.22)',
                    transform: 'translateY(-1px)',
                  }}
                  onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                >
                  {isDescriptionExpanded ? 'Свернуть описание' : 'Показать полностью'}
                </Button>
              ) : null}
            </VStack>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.46, ease: 'easeOut', delay: 0.2 }}
        >
          <Box
            mt={5}
            mb={10}
            bg="rgba(17, 23, 58, 0.52)"
            border="1px solid rgba(255,255,255,0.2)"
            borderRadius="22px"
            p={{ base: 3, md: 6 }}
            backdropFilter="blur(6px)"
          >
            <Text fontSize={{ "2xl": '40px', lg: '32px', md: "26px", base: "22px" }} color="white" fontWeight="700">
              Адрес
            </Text>
            <Text fontSize={{ "2xl": '24px', lg: '17px', md: "15px", base: "14px" }} color="white" mt={3}>
              {organizationsMap[Number(eventDetails.organization)] ||
                eventDetails.organization ||
                'Адрес не указан'}
            </Text>
            {eventDetails.address ? (
              <Text fontSize={{ "2xl": '21px', lg: '17px', md: "15px", base: "14px" }} color="white" mt={1}>
                {eventDetails.address}
              </Text>
            ) : null}
            {eventDetails.city ? (
                <Text fontSize={{ "2xl": '20px', lg: '17px', md: "15px", base: "14px" }} color="white" mt={1}>
                  Район {districtMap[eventDetails.city?.toLowerCase()] || eventDetails.city}
                </Text>
              ) : null}

            <Button
              mt={4}
              bg="rgba(255,255,255,0.12)"
              color="white"
              border="1px solid rgba(255,255,255,0.3)"
              borderRadius="full"
              px={{ base: 4, md: 6 }}
              py={{ base: 4, md: 6 }}
              fontSize={{ base: '14px', md: '16px', lg: '18px' }}
              textDecoration="none"
              transition="all .2s ease"
              _hover={{
                bg: 'rgba(255,255,255,0.22)',
                transform: 'translateY(-1px)',
                boxShadow: '0 10px 24px rgba(8, 12, 30, 0.35)',
              }}
              onClick={() => navigate(`/organizer/${eventDetails.organization}`)}
            >
              Страница организатора
            </Button>
          </Box>
        </motion.div>
      </Box>
    </Flex>
  );
};

export default Events;