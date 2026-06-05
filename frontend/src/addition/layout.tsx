import { Button, Flex, HStack, Image, Input, Separator, Stack, Text,Box } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { LuSearch } from 'react-icons/lu';
import { Outlet, useNavigate } from 'react-router-dom';
import { useUser } from '../addition/context';
import { ContainerFluid } from '../components/ui/container';
import { InputGroup } from '../components/ui/input-group';
import LoginModal from '../pages/authorization';
import RegisterModal from '../pages/registration';
import assistant from '../pictures/assistant.png';
import AiAssistantModal from '../modal/assistant';

const Layout = () => {
  const { isAuthenticated, setUsername, setSearchQuery } = useUser();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
      console.log('===== AUTH DEBUG =====');
      console.log('isAuthenticated:', isAuthenticated);
      console.log('username from localStorage:', localStorage.getItem('username'));
      console.log('======================');
    }, [isAuthenticated]);
    const openModal = () => {
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

  const handleLoginSuccess = () => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  };

  const handleProfileClick = () => {
    navigate('/account');
  };

  const openLoginModal = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegisterModal = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const handleIconClick = () => {
    navigate('/');
  };

  const handleSearchFocus = () => {
    if (location.pathname === '/account' || location.pathname.startsWith('/event/')) {
      navigate('/');
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
  };

  return (
    <>
      <ContainerFluid zIndex={2} position="fixed" left={0} right={0} top={5}>
        <Flex align="center" p={3} bg="#22212C" boxShadow="md" borderRadius="xl" margin="0 auto">
          <Image
            mr={2}
            src="/icons/logo-filled.svg"
            alt="logo"
            boxSize={{ lg: '36px', base: '24px' }}
            objectFit="contain"
            userSelect="none"
            onClick={handleIconClick}
            style={{ cursor: 'pointer' }}
          />
          <HStack gap="2" width="full">
            <InputGroup flex="1" startElement={<LuSearch size={12} color="white"/>}>
              <Input
                variant="outline"
                placeholder="Поиск"
                bg="gray.700"
                h="40px"
                color="white"
                flex="1"
                borderRadius={{ xl: 'xl', lg: 'xl', base: 'lg' }}
                border="none"
                _focus={{ border: 'none', boxShadow: 'none' }}
                _placeholder={{ color: 'gray.300' }}
                fontSize="14px"
                fontFamily="Unbounded"
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
              />
            </InputGroup>
          </HStack>
          {isAuthenticated ? (
            <Button bg="transparent" p={{ lg: 3,md: 3, base: 0 }} onClick={handleProfileClick} _hover={{ bg: 'transparent' }}>
              <Image
                src="/icons/profile.svg"
                alt="User Icon"
                boxSize={{ xl: '35px', lg: '35px', md: '30px', base: '25px' }}
                objectFit="contain"
                userSelect="none"
              />
            </Button>
          ) : (
            <Button
              bg="white"
              fontWeight="bold"
              width={{ base: '70px', lg: '100px' }}
              height="40px"
              fontSize={{ base: 'sm', lg: 'md' }}
              ml={{ lg: '4', base: '2' }}
              color="black"
              borderRadius="lg"
              onClick={openLoginModal}
              _hover={{ bg: '#4C6BE6', color: 'white', boxShadow: '0px 4px 32px rgba(114, 150, 204, 0.5)' }}
              fontFamily="Unbounded"
            >
              Войти
            </Button>
          )}
        </Flex>
      </ContainerFluid>
      <Flex pt="100px" flex={1}>
        <Outlet />
      </Flex>
      <ContainerFluid mt="24px">
        <Stack>
          <Separator mt={5} borderColor="black" />
          <HStack mt={3} align="center" mb={5} justify="space-between" w="100%">
            <Text
              fontFamily="Unbounded"
              color="black"
              fontSize={{ base: '13px', lg: '15px', xl: '18px' }}
              textAlign="left"
            >
              © {new Date().getFullYear()} "Афиша мероприятий" – сайт создан студентами 4 курса Сологубовой Владой и Захаровым Ильёй
            </Text>
            <Image
              src="/icons/logo-outlined.svg"
              alt="logo"
              boxSize="40px"
              objectFit="contain"
              userSelect="none"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ cursor: 'pointer' }}
            />
          </HStack>
        </Stack>
        
      </ContainerFluid>
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
      <Box
        position="fixed"
        right="40px"
        bottom="60px"
        zIndex={100}
        cursor="pointer"
        onClick={openModal}
        transition="0.2s"
        _hover={{
          transform: 'scale(1.05)',
        }}
          _active={{
          transform: 'scale(0.96)',
        }}
        >
        <Image
          src={assistant}
          alt="assistant"
          maxW={{ base: '120px', md: '180px', lg: '110px' }}
          pointerEvents="none"
          userSelect="none"

        />
        </Box>
        <AiAssistantModal
          isOpen={isOpen}
          onClose={closeModal}
        />
    </>
  );
};

export default Layout;
