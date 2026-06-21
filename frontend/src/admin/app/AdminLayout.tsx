import { Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiActivity, FiBriefcase, FiCpu, FiDatabase, FiHome, FiLogOut, FiUsers } from 'react-icons/fi';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';

const MotionBox = motion(Box);

const navItems = [
  { to: '/admin/dashboard', label: 'Дашборд', icon: FiHome },
  { to: '/admin/events', label: 'Мероприятия', icon: FiActivity },
  { to: '/admin/organizations', label: 'Организации', icon: FiBriefcase },
  { to: '/admin/users', label: 'Пользователи', icon: FiUsers },
  { to: '/admin/parser', label: 'Парсер', icon: FiDatabase },
  { to: '/admin/ai', label: 'AI Индексация', icon: FiCpu },
];

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Панель администратора',
  '/admin/events': 'Управление мероприятиями',
  '/admin/organizations': 'Управление организациями',
  '/admin/users': 'Управление пользователями',
  '/admin/parser': 'Управление парсером',
  '/admin/ai': 'Индексация AI / Embeddings',
};

const AdminLayout: React.FC = () => {
  const { pathname } = useLocation();
  const { logout, session } = useAdminAuth();
  const pageTitle = pageTitles[pathname] || 'Панель администратора';

  return (
    <Flex minH="100vh" bg="#111322">
      <Box
        w="280px"
        bg="linear-gradient(180deg, #1E2340 0%, #151933 100%)"
        borderRight="1px solid rgba(153, 171, 255, 0.28)"
        position="fixed"
        top={0}
        left={0}
        bottom={0}
        p={5}
        zIndex={20}
      >
        <VStack align="stretch" h="100%" gap={6}>
          <Box>
            <Text color="white" fontSize="21px" fontWeight="800" fontFamily="Unbounded">
              Afisha Admin
            </Text>
            <Text color="gray.400" fontSize="12px" mt={1}>
              Панель управления сайтом
            </Text>
          </Box>

          <VStack align="stretch" gap={2}>
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    justifyContent="flex-start"
                    w="full"
                    bg={active ? 'rgba(114, 150, 204, 0.28)' : 'transparent'}
                    color={active ? 'white' : 'gray.300'}
                    border="1px solid"
                    borderColor={active ? 'rgba(114, 150, 204, 0.55)' : 'transparent'}
                    borderRadius="12px"
                    h="42px"
                    _hover={{
                      bg: 'rgba(114, 150, 204, 0.2)',
                      color: 'white',
                    }}
                  >
                    <HStack gap={2} justify="flex-start" w="full">
                      <item.icon />
                      <Text>{item.label}</Text>
                    </HStack>
                  </Button>
                </Link>
              );
            })}
          </VStack>

          <Box mt="auto">
            <Box
              bg="rgba(255,255,255,0.04)"
              border="1px solid rgba(255,255,255,0.1)"
              borderRadius="12px"
              p={3}
              mb={3}
            >
              <Text color="gray.300" fontSize="12px">
                Вы вошли как
              </Text>
              <Text color="white" fontSize="14px" fontWeight="700">
                {session?.username || 'admin'}
              </Text>
            </Box>
            <Button
              w="full"
              bg="rgba(253, 107, 107, 0.15)"
              color="#FF9C9C"
              border="1px solid rgba(253, 107, 107, 0.45)"
              _hover={{ bg: 'rgba(253, 107, 107, 0.25)' }}
              onClick={logout}
            >
              <HStack gap={2}>
                <FiLogOut />
                <Text>Выйти</Text>
              </HStack>
            </Button>
          </Box>
        </VStack>
      </Box>

      <Box ml="280px" w="calc(100% - 280px)">
        <Box
          position="sticky"
          top={0}
          zIndex={10}
          backdropFilter="blur(10px)"
          bg="rgba(17, 19, 34, 0.75)"
          borderBottom="1px solid rgba(140, 157, 255, 0.2)"
          px={8}
          py={4}
        >
          <HStack justify="space-between">
            <Box>
              <Text color="white" fontSize="22px" fontWeight="700">
                {pageTitle}
              </Text>
              <Text color="gray.400" fontSize="12px">
                Современная админ-панель управления контентом
              </Text>
            </Box>
          </HStack>
        </Box>

        <MotionBox
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          px={8}
          py={6}
        >
          <Outlet />
        </MotionBox>
      </Box>
    </Flex>
  );
};

export default AdminLayout;
