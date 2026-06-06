import { Button, Flex, Heading, HStack, Image, Separator, Stack, Text, VStack, Box, AspectRatio } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../addition/context';
import LoginModal from '../pages/authorization';
import RegisterModal from '../pages/registration';
import fon from '../pictures/fon2.png';
import axios from '../shared/lib/axios';
import { Toaster, toaster } from "../components/ui/toaster"
import EventImage from '../pictures/picture1.png';
import star_empty from '../pictures/Star1.png';
import star_full from '../pictures/Star2.png';

interface EventDetails {
  id: number;
  name: string;
  description: string;
  location: string;
  group_id: string;
  external_url: string;
  date_event: string[];
  duration: string;
  price: string;
  address: string;
  city: string;
  age_limit: string;
  picture_url: string;
  horizontal_picture_url?: string;
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

  const toggleFavorite = async (index: number) => {
    if (!userId) {
      setIsLoginOpen(true);
      return;
    }

    try {
      const response = await axios.patch(
        `/user/add_like_events`,
        null,
        {
          params: {
            user_id: userId,
            event_id: eventId,
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
      try {

        const response = await axios.get(
          `/event/event{id}/?event_id=${eventId}`
        );

        console.log('EVENT DETAILS:', response.data);

        const data = response.data;

        const normalizedEvent: EventDetails = {
          ...data,

          picture_url:
            data.picture_url ||
            data.pictures_url ||
            '',

          horizontal_picture_url:
            data.horizontal_picture_url || '',

          group_id: String(data.group_id),

          date_event: Array.isArray(data.date_event)
            ? data.date_event
            : [data.date_event],
        };

        setEventDetails(normalizedEvent);

      } catch (error) {
        console.error(
          'Ошибка загрузки мероприятия:',
          error
        );
      }
    };

    if (eventId) {
      fetchEventDetails();
    }

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

  const formattedAgeLimit = `${eventDetails.age_limit || '0'}+`;

  const parsedDates = (eventDetails.date_event || []).map((date) => {
    if (!date) {
      return { day: 0, month: 0 };
    }

    const [year, month, day] = date.split('-');

    return {
      day: parseInt(day || '0', 10),
      month: parseInt(month || '0', 10),
    };
  });

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

      {eventDetails.horizontal_picture_url && (
        <Box position="absolute" top={0} left={0} width="100%" height='100%' maxWidth="1960px"
          >
          <Image
            src={eventDetails.horizontal_picture_url}
            alt="Изображение мероприятия"
            objectFit="cover"
            objectPosition="top center"
            width="100%"
            height={{ base: '275px', sm:"320px", md: '430px', lg: '430px', xl: '540px', "2xl":'735px'}}
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
            height={{ base: '275px', sm:"320px", md: '430px', lg: '430px', xl: '540px', "2xl": '735px'}}
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
        fontFamily="Unbounded" userSelect="none"
      >
        <Flex wrap="wrap" mt={{ "2xl": 25}} align="flex-end"
        >
          <VStack w={{ "2xl": '380px', xl: '280px', lg: '200px', md: "190px", sm:"125px", base: "100px" }}>
            <Image src={eventDetails.picture_url} alt={eventDetails.name} objectFit="cover" width="100%"
              height={{ "2xl": '550px',xl: '410px', md: '300px', sm: '200px', base: '150px' }} borderRadius="6px" 
              onError={(e) => {
                                (e.target as HTMLImageElement).src = EventImage;
                              }}/>
          </VStack>
          <VStack align="start" gap="4"  ml={{ xl: 8, base: 3 }} justifyContent="flex-end" height="full">
            <Heading
              as="h1"
              color="white"
              fontSize={{ "2xl": '60px', lg: '40px', md: "30px", sm:"17px", base: "18px" }}
              fontWeight="700"
              fontFamily="Unbounded"
              lineHeight="1"
              whiteSpace="normal"
              textAlign="start"
              maxWidth={{ "2xl": '800px',lg: '500px', md: "400px", sm: "300px", base: "200px" }}
              overflow="hidden"
              textOverflow="ellipsis"
              lineClamp={4}
            >
              {eventDetails.name}
            </Heading>
            {/* <Button
              bg="white"
              color="black"
              fontSize={{ "2xl": '50px',  lg: '30px',md:"25px",  sm:"16px", base: "13px" }}
              fontWeight="900"
              padding={{ "2xl": '40px',  lg: '25px', base: "10px" }}
              bottom="0px"
              width={{ "2xl": '800px', lg: '500px', md: "430px",  sm:"270px", base: "210px" }}
              borderRadius="xl"
              boxShadow="0px 4px 32px rgba(114, 150, 204, 0.5)"
              _hover={{
                bg: '#8499EE',
                color: 'white',
                boxShadow: '0px 4px 32px rgba(114, 150, 204, 0.5)',
                border: '2px solid white',
              }}
              onClick={handleBookTicket}
            >
              Добавить в избранное
            </Button> */}
          </VStack>
      </Flex>
        <Stack >
          <Text mt={{ "2xl": '20', base: "8" }} fontSize={{ "2xl": '50px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold">
            Расписание
          </Text>
          <Separator mt={{ "2xl": '5', base: "1" }} borderColor="white"/>
        </Stack>

        <Flex direction={{ base: "column", "sm": "row" }} align="start" justify="space-between" mt={{ "2xl": '6', base: "2" }}>
          {/* <VStack align="start" gap={2} w="100%">
            {parsedDates.map((d, index) => (
              <HStack key={index} w="100%" position="relative">
  
                <HStack>
                  <Text fontSize="60px" fontWeight="bold" color="white">
                    {d.day}
                  </Text>

                  <Text fontSize="25px" fontWeight="bold" color="#0E3EA0">
                    {monthNames[d.month - 1]}
                  </Text>
                </HStack>

                <Text
                  color="white"
                  position="absolute"
                  left="50%"
                  transform="translateX(-50%)"
                  fontSize="20px"
                >
                  {eventDetails.duration.substring(0, 5)}
                </Text>

                <Text color="white" fontSize="18px" position="absolute" left="70%">
                  {Number(eventDetails.price) === 0 ? 'Бесплатно' : `от ${eventDetails.price} рублей`}
                </Text>
              
              </HStack>
              
            ))}
            
          </VStack> */}
          <VStack align="start" w="100%">
  {parsedDates.map((d, index) => (
    <>
    <HStack key={index} w="100%" justify="space-between" >

      {/* ЛЕВАЯ ЧАСТЬ — дата */}
      <HStack gap="15px">
        <Text
          fontSize={{ "2xl": '60px', lg: '47px', md: "35px", base: "30px" }}
          fontWeight="bold"
          color="white"
        >
          {d.day}
        </Text>

        <Text
          fontSize={{ "2xl": '25px', lg: '20px', md: "15px", base: "11px" }}
          fontWeight="bold"
          color="#0E3EA0"
        >
          {monthNames[d.month - 1]}
        </Text>
      </HStack>

      <HStack >

        <Text color="white" fontSize={{ "2xl": '20px'}} transform="translateX(-340px)">
          {eventDetails.duration?.substring(0, 5) || '—'}
        </Text>

        <Box
        as="button"
        onClick={() => toggleFavorite(index)}
        transition="0.2s"
        _hover={{
          transform: "scale(1.08)",
        }}

      >
        <Image
          src={favorites[index] ? star_full : star_empty}
          alt="favorite"
          boxSize={{
            "2xl": "50px",
            xl: "50px",
            lg: "45px",
            md: "40px",
            sm: "32px",
          }}
          objectFit="contain"
          
        />
      </Box>

        <Button
          bg="white"
          color="black"
          fontSize={{ "2xl": '25px', xl: '30px', md: "25px", lg: '25px', sm: "14px"}}
          fontWeight="800"
          ml="20px"
          padding={{ "2xl": '33px', xl: '20px', md: "20px", lg:"10px"}}
          borderRadius="xl"
          boxShadow="0px 4px 32px rgba(114, 150, 204, 0.5)"
          _hover={{ bg: 'black', color: 'white' }}
          onClick={handleBookTicket}
        >
          Купить билет
        </Button>

      </HStack>

    </HStack>
    {index !== parsedDates.length - 1 && (
        <Box w="100%" >
          <Separator borderColor="white" my={3}/>
        </Box>
      )}
    </>
  ))}
</VStack>

          {/* <Box display={{ base: "none", "sm": "block" }} mt={{ "2xl": '7px', lg: "4",md: "1",}}>
            <Button
              bg="white"
              color="black"
              fontSize={{ "2xl": '30px', xl: '30px', md: "25px", lg: '25px', sm: "14px"}}
              fontWeight="900"
              padding={{ "2xl": '35px', xl: '20px', md: "20px", lg:"10px"}}
              borderRadius="xl"
              boxShadow="0px 4px 32px rgba(114, 150, 204, 0.5)"
              _hover={{ bg: 'black', color: 'white' }}
              ml="auto"
            onClick={handleBookTicket}
            >
              Добавить в избранное
            </Button>
          </Box> */}
        </Flex>
        <Stack w="100%" >
          <Separator mt={5} borderColor="white"/>
        </Stack>
        <Text fontSize={{ "2xl": '50px', xl: '1px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt="8">
          О событии
        </Text>
        <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white" mt="3">
          {eventDetails.description}
        </Text>
        <Text fontSize={{ "2xl": '50px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold" mt="5">
          Адрес
        </Text>
        <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white">
          {eventDetails.location}
        </Text>
        <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white">
          {eventDetails.address}
        </Text>
        <Text
          fontSize="50px"
          color="white"
          mt="10px"
          fontWeight="bold"
        >
          <a
            href="/organizer"
            style={{ color: 'white', textDecoration: 'underline' }}
          >
            Страница организатора
          </a>
        </Text>
      </Box>
    </Flex>
  );
};

export default Events;