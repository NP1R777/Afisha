import { Button, Flex, Heading, HStack, Image, Separator, Stack, Text, VStack, Box, AspectRatio } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../addition/context';
import LoginModal from '../pages/authorization';
import RegisterModal from '../pages/registration';
import fon from '../pictures/fon2.png';
import axios from '../shared/lib/axios';
import { Toaster, toaster } from "../components/ui/toaster"
import EVENTS from '../shared/config/mock.json';
import EventImage from '../pictures/picture1.png';

interface EventDetails {
  id: number;
  name: string;
  description: string;
  location: string;
  group_id: string;
  external_url: string;
  date_event: string;
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

  // useEffect(() => {
  //   const fetchEventDetails = async () => {
  //     try {
  //       const response = await axios.get(`/event/event{id}/?event_id=${eventId}`);
  //       setEventDetails(response.data);
  //     } catch (error) {
  //       console.error('Error fetching event details:', error);
  //     }
  //   };

  //   if (eventId) {
  //     fetchEventDetails();
  //   }
  // }, [eventId]);
useEffect(() => {
  if (eventId) {
    const event = EVENTS.events.find((e) => e.id === Number(eventId));
    if (event) {
      // Преобразуем данные из мок-файла в EventDetails
      const eventDetails: EventDetails = {
        ...event,
        picture_url: event.pictures_url, // переименование
        group_id: String(event.group_id), // или Number, если нужно
      };
      setEventDetails(eventDetails);
    } else {
      console.error('Мероприятие не найдено');
    }
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

  const handleBookTicket = async () => {
    if (!userId) {
      setIsLoginOpen(true);
      return;
    }

    try {
      const response = await axios.patch(`/user/add_like_events`, null, {
        params: {
          user_id: userId,
          event_id: eventId,
        },
      });

      if (response.status === 200) {
        toaster.success({
          title: 'Мероприятие успешно добавлено в избранное!',
          description: 'Чтобы посмотреть все избранные мероприятия, перейдите в аккаунт пользователя',
          duration: 5000
        });
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        toaster.create({
          title: 'Мероприятие уже добавлено в избранное.',
          description: 'Чтобы посмотреть все избранные мероприятия, перейдите в аккаунт пользователя',
          duration: 5000
        });
    }
  }
  };

  const monthNumber = eventDetails.date_event.split('-')[1];
  const monthName = monthNames[parseInt(monthNumber, 10) - 1];
  const formattedAgeLimit = eventDetails.age_limit.endsWith('+') ? eventDetails.age_limit : `${eventDetails.age_limit}+`;

  const day = parseInt(eventDetails.date_event.split('-')[2], 10);

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
            <Button
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
            </Button>
          </VStack>
      </Flex>
        <Stack >
          <Text mt={{ "2xl": '20', base: "8" }} fontSize={{ "2xl": '50px', lg: '40px', md: "30px", base: "20px" }} color="white" fontWeight="bold">
            Расписание
          </Text>
          <Separator mt={{ "2xl": '5', base: "1" }} borderColor="white"/>
        </Stack>

        <Flex direction={{ base: "column", "sm": "row" }} align="start" justify="space-between" mt={{ "2xl": '6', base: "2" }}>
          <HStack justify="space-between" w="100%" align="start">
            <VStack align="start">
              <Text fontSize={{ "2xl": '60px', lg: '47px', md: "35px", base: "30px" }} fontWeight="bold" color="white">
                {day}
              </Text>
            </VStack>
            <VStack align="start" mt={{ "2xl": '7', lg: '5', base: "4" }}>
              <Text fontSize={{ "2xl": '25px', lg: '20px', md: "15px", base: "11px" }} fontWeight="bold" color="#0E3EA0">
                {monthName}
              </Text>
            </VStack>
            <HStack align="center" mt={{ "2xl": '7',lg: '5', base: "4" }} ml="auto">
              <Text fontSize={{ "2xl": '25px', lg: '20px', md: "15px", base: "10px" }} color="white">
                {eventDetails.duration.substring(0, 5)}
              </Text>
              <Text fontSize={{ "2xl": '20px', lg: '15px', md: "15px", base: "10px" }} color="white" ml={{ "2xl": '48', lg: '20',base: "14" }} mr={{ "2xl": '10', sm: "5" }}>
                {formattedAgeLimit}
              </Text>
            </HStack>
          </HStack>
          <Box mt={{ base: "4", sm: "0" }} w="100%" display={{ base: "block", "sm": "none" }}>
            <Button
              bg="white"
              color="black"
              fontSize="23px"
              fontWeight="900"
              padding="21px"
              w="100%"
              borderRadius="xl"
              boxShadow="0px 4px 32px rgba(114, 150, 204, 0.5)"
              _hover={{ bg: 'black', color: 'white' }}
            >
              {Number(eventDetails.price) === 0 ? 'Бесплатно' : `от ${eventDetails.price} рублей`}
            </Button>
          </Box>
          <Box display={{ base: "none", "sm": "block" }} mt={{ "2xl": '7px', lg: "4",md: "1",}}>
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
            >
              {Number(eventDetails.price) === 0 ? 'Бесплатно' : `от ${eventDetails.price} рублей`}
            </Button>
          </Box>
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
        <Text fontSize={{ "2xl": '20px', lg: '15px', md: "14px", base: "10px" }} color="white" mb={8} mt={5}>
          Подробная информация от организатора:
          <br />
          <a href="https://кдц-высоцкого.рф/repertuar/?place=9a05e654-1532-4d5c-a486-d33fb5dbbc3f&city=7379699a-aff5-49a7-82b0-c53189dc2c44&language=ru" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>
            https://кдц-высоцкого.рф/repertuar/?place=9a05e654-1532-4d5c-a486-d33fb5dbbc3f&city=7379699a-aff5-49a7-82b0-c53189dc2c44&language=ru
          </a>
        </Text>
      </Box>
    </Flex>
  );
};

export default Events;
