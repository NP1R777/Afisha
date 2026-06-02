import { Box, Flex, Image, Button, Text, useBreakpointValue } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useUser } from '../addition/context';
import comp from '../pictures/comp.png';
import barcode from '../pictures/barcode.png';
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

interface Event {
  name: string;
  created_at: string;
  update_at: string;
  group_id: number;
  date_event: string;
  duration: string;
  price: number;
  address: string;
  picture_url: string;
  deleted_at: string | null;
  id: number;
  description: string;
  external_url: string;
  location: string;
  city: string;
  age_limit: string;
  horizontal_picture_url: string | null;
}

const Account = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { username, userId, setEmail, setBirthdate, categories, setCategories,setUsername } = useUser();
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isOrganizerRegisterOpen, setIsOrganizerRegisterOpen] = useState(false);

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
    if (userId) {
      try {
        const response = await axios.get(`/user/get_user?user_id=${userId}`);
        const data = await response.data;
        setCategories(data.preferences);
        if (data.email) {
          setEmail(data.email);
        }

        if (data.date_of_birth) {
          setBirthdate(data.date_of_birth);
        }
      } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
      }
    }
  };

  const fetchEvents = async () => {
    if (userId) {
      try {
        const response = await axios.get(`/user/get_like_events?user_id=${userId}`);
        const data = await response.data;
        const flattenedEvents = data.flat();
        setEvents(flattenedEvents);
      } catch (error) {
        console.error('Ошибка при получении данных о мероприятиях:', error);
      }
    }
  };

  // useEffect(() => { временно мок данные заменяют 
  //   fetchUserData();
  //   fetchEvents();
  // }, [userId]);

  const mockUser = {
  username: 'Lada',
  email: 'vlada@gmail.com',
  birthdate: '2004-03-29',
  isOrganizer: true,
};

const isOrganizer = mockUser.isOrganizer;

useEffect(() => {
  setUsername(mockUser.username);
  setEmail(mockUser.email);
  setBirthdate(mockUser.birthdate);

  setCategories([
    '1', // Театр
    '3', // Кино
    '7', // Музыка
    '6', // Культура
    '5', // Спорт
    '8', // Юмор
    '9', // Образование
    '10', // Благотворительность
    '11', // Городские праздники
  ]);

  // MOCK EVENTS
  setEvents([
    {
      id: 1,
      name: 'Большой симфонический концерт',
      created_at: '2026-05-01',
      update_at: '2026-05-01',
      group_id: 1,
      date_event: '2026-06-15T18:00:00',
      duration: '19:00:00',
      price: 2500,
      address: 'г. Москва, ул. Тверская, 12',
      picture_url:
        'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1200&auto=format&fit=crop',
      deleted_at: null,
      description: 'Лучшие произведения мировой классики.',
      external_url: 'https://example.com',
      location: 'Концертный зал "Россия"',
      city: 'Москва',
      age_limit: '12',
      horizontal_picture_url: null,
    },
    {
      id: 9,
      name: "Волки и овцы",
      description: "«Разве кругом нас люди живут?.. Волки да овцы. Волки кушают овец, а овцы смиренно позволяют себе кушать…» - так рассуждает один из героев комедии А.Н. Островского, созданной в далеком 1875-м. Время идет, и мораль тех, кто живет в поисках успеха и богатства, становится только изощреннее. Зная, что граница между хищниками и их жертвами все менее известна, так что они смотрят, как они друг на друга, как в зеркало, наслаждаясь крайне опасным общением. Страсти вокруг молодой богатой вдовушки Евлампии Купавиной – это и комедия, и мелодрама, и детектив. Охота за рождает множество плутовских планов и сюжетов, но когда в расчеты вмешиваются еще и «нежные чувства» - трудно разобрать, где волки, где овцы… Так что правда в народе говорят: «любит волка, ловят и волка» или «волки умерли, но и волков умерли» … Постановка спектакля проводится в рамках партийного проекта Культура малой Родины.",
      location: "Норильский Заполярный театр драмы им. В. Маяковского",
      group_id: 1,
      external_url: "https://www.northdrama.ru/repertuar/volki-i-ovczy",
      date_event: '2026-01-29T19:00:00',
      duration: "19:00:00",
      address: "Ленинский пр., 34",
      city: "Норильск",
      age_limit: "12",
      picture_url: "https://www.northdrama.ru/wp-content/uploads/2023/10/afisha_volki-i-ovczy_sajt-543x768.png",
      horizontal_picture_url: "https://www.northdrama.ru/wp-content/uploads/2023/10/dsc_6706-1024x681.jpg",
      created_at: '2026-05-01',
      update_at: '2026-05-01',
      price: 2500,
      deleted_at: null,
    },
    {
    id: 1,
    name: 'Призрак в доспехах (дубляж Студийная Банда) ',
    description:
      'Культовое аниме о будущем, кибернетике и искусственном интеллекте.',
    location: 'КДЦ им. Вл. Высоцкого',
    group_id: 2,
    external_url:
      'https://xn----dtbdb3ad1abbz6ce6d.xn--p1ai',
    date_event: '2026-06-15T21:30:00',
    duration: '21:30:00',
    price: 200,
    address: 'ул. Строителей, 17',
    city: 'Талнах',
    age_limit: '18',
    picture_url:
      'https://avatars.mds.yandex.net/get-kinopoisk-image/10768063/5a1103cf-1e9f-4e90-9113-81f0961c969c/600x900',
    horizontal_picture_url:
      'https://avatars.mds.yandex.net/get-kinopoisk-post-img/4964913/b3e8cb9fd6cdfbe43addae212e4071f3/1920x1080',
    created_at: '2026-05-01',
    update_at: '2026-05-01',
    deleted_at: null,
  },

  {
    id: 2,
    name: 'Щелкунчик',
    description:
      'Знаменитая рождественская история о Мари и волшебном мире.',
    location: 'Норильский театр драмы',
    group_id: 1,
    external_url:
      'https://www.northdrama.ru/repertuar/shhelkunchik',
    date_event: '2026-07-03T11:00:00',
    duration: '11:00:00',
    price: 350,
    address: 'Ленинский пр., 34',
    city: 'Норильск',
    age_limit: '6',
    picture_url:
      'https://www.northdrama.ru/wp-content/uploads/2022/04/shhelkunchik.png',
    horizontal_picture_url:
      'https://www.northdrama.ru/wp-content/uploads/2022/04/21_0.jpg',
    created_at: '2026-05-01',
    update_at: '2026-05-01',
    deleted_at: null,
  },

  {
    id: 3,
    name: 'Волки и овцы',
    description:
      'Комедия Островского о человеческой жадности, хитрости и любви.',
    location: 'Норильский театр драмы',
    group_id: 1,
    external_url:
      'https://www.northdrama.ru/repertuar/volki-i-ovczy',
    date_event: '2026-08-20T19:00:00',
    duration: '19:00:00',
    price: 500,
    address: 'Ленинский пр., 34',
    city: 'Норильск',
    age_limit: '12',
    picture_url:
      'https://www.northdrama.ru/wp-content/uploads/2023/10/afisha_volki-i-ovczy_sajt-543x768.png',
    horizontal_picture_url:
      'https://www.northdrama.ru/wp-content/uploads/2023/10/dsc_6706-1024x681.jpg',
    created_at: '2026-05-01',
    update_at: '2026-05-01',
    deleted_at: null,
  },
  ]);
}, []);

  const imageSrc = useBreakpointValue({ base: com2, lg: com });

const getPreferenceText = (preferenceId: number): string => {
  switch (preferenceId) {
    case 1:
      return 'Театр';
    case 3:
      return 'Кино';
    case 5:
      return 'Спорт';
    case 6:
      return 'Культура';
    case 7:
      return 'Музыка';
    case 8:
      return 'Юмор';
    case 9:
      return 'Образование';
    case 10:
      return 'Благотворительность';
    case 11:
      return 'Городские праздники';
    default:
      return 'Неизвестное предпочтение';
  }
};

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatAgeLimit = (ageLimit: string) => {
    const trimmedAgeLimit = ageLimit.trim();
    return /^\d+$/.test(trimmedAgeLimit) ? `${trimmedAgeLimit}+` : ageLimit;
  };

  const getTruncatedUsername = (name: string) => {
    if (name.length > 10) {
      return name.substring(0, 10) + '...';
    }
    return name;
  };
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
        {!isOrganizer ? (
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
                {events.map((event, index) => (
                  <Flex key={index} userSelect="none" direction={{ base: 'column', md: 'row' }}>
                    <Box
                      bg="#4C6BE6"
                      borderRadius="xl"
                      height={{ base: '650px', md: '250px' }}
                      width={{ base: '250px', md: '600px', lg: '800px', xl: '1000px' }}
                      p={7}
                      color="white"
                      fontWeight="semibold"
                      position="relative"
                    >
                      <Flex direction={{ base: 'column', md: 'row' }} align="center" height="100%" gap={4}>
                        <Image
                          src={event.picture_url}
                          alt={event.name}
                          height={{ base: '260px', md: '195px' }}
                          width={{ base: '180px', md: '130px' }}
                          pointerEvents="none"
                          borderRadius={{ base: 'md', md: 'xl' }}
                        />
                        <Flex direction="column" justify="space-between" flex="1" height="100%">
                          <Flex
                            justify="space-between"
                            align="stretch"
                            direction={{ base: 'column', md: 'row' }}
                            width="100%"
                          >
                            <Text
                              fontSize={{ base: '20px', md: '19px', lg: '25px' }}
                              textAlign={{ base: 'center', md: 'left' }}
                              alignSelf={{ base: 'center', md: 'flex-start' }}
                              lineClamp={4}
                            >
                              {event.name}
                            </Text>
                            <Text
                              fontSize={{ base: '13px', md: '10px', lg: '15px' }}
                              textAlign={{ base: 'center', md: 'left' }}
                              alignSelf={{ base: 'center', md: 'flex-start' }}
                              maxW={{ base: '80%', md: '250px' }}
                              lineClamp={4}
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
                                {new Date(event.date_event).getDate()}
                              </Text>
                              <Text fontSize="15px" color="#0E3EA0">
                                {new Date(event.date_event).toLocaleString('default', { month: 'long' }).toUpperCase()}
                              </Text>
                            </Flex>
                            <Flex mt={5}>
                              <Text fontSize="20px" textAlign="center" mb={2}>
                                {formatTime(event.duration)}
                              </Text>
                              <Text
                                fontSize="15px"
                                textAlign="right"
                                ml={{ base: 10, md: 20, lg: 40 }}
                                mb={5}
                                mt={{ base: 1, md: 1 }}
                              >
                                {formatAgeLimit(event.age_limit)}
                              </Text>
                            </Flex>
                          </Flex>
                        </Flex>
                      </Flex>
                    </Box>
                    <Box
                      bg="#6B84EA"
                      borderRadius="xl"
                      height={{ base: '160px', md: '250px' }}
                      width={{ base: '250px', md: '160px' }}
                      p={7}
                      color="white"
                      fontWeight="semibold"
                    >
                      <Flex
                        align="center"
                        justify="center"
                        height="100%"
                        transform={{ base: 'rotate(90deg)', md: 'rotate(0deg)' }}
                      >
                        <Image src={barcode} alt="Barcode" height="150px" width="93px" pointerEvents="none" />
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
        ) : (
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
          <Calendar />
        </Box>
      )}
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
