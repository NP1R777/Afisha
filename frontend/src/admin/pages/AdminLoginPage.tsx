import { Box, Button, Flex, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../app/AdminAuthContext';

const MotionBox = motion(Box);

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAdminAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
      const state = location.state as { from?: { pathname?: string } } | null;
      const target = state?.from?.pathname || '/admin/dashboard';
      navigate(target, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Не удалось войти в админ-панель');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="radial-gradient(1200px 600px at 20% 0%, #283372 0%, #111322 60%)"
      px={4}
    >
      <MotionBox
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        w="full"
        maxW="460px"
        bg="rgba(23, 28, 56, 0.92)"
        border="1px solid rgba(145, 164, 255, 0.36)"
        borderRadius="20px"
        p={8}
        boxShadow="0 20px 50px rgba(0, 0, 0, 0.4)"
      >
        <Heading color="white" fontSize="30px" fontFamily="Unbounded" mb={2}>
          Admin Login
        </Heading>
        <Text color="gray.300" fontSize="14px" mb={6}>
          Вход доступен только пользователям с ролью <b>admin</b>.
        </Text>

        <Stack gap={4}>
          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Логин"
            bg="white"
            color="black"
          />
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Пароль"
            bg="white"
            color="black"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSubmit();
              }
            }}
          />
          {error ? (
            <Text color="#ff9a9a" fontSize="13px">
              {error}
            </Text>
          ) : null}
          <Button
            onClick={onSubmit}
            loading={loading}
            bg="#7296CC"
            color="white"
            _hover={{ bg: '#89AEE6' }}
          >
            Войти в админ-панель
          </Button>
        </Stack>
      </MotionBox>
    </Flex>
  );
};

export default AdminLoginPage;
