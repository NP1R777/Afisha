import { Box, Button, Flex, Grid, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiActivity, FiCpu, FiDatabase, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import AdminStatCard from '../components/AdminStatCard';
import { fetchEventCategories, fetchEvents, fetchParsedEvents, fetchUsers } from '../services/adminApi';
import { useAdminAuth } from '../app/AdminAuthContext';
import { useEffect, useState } from 'react';

const MotionBox = motion(Box);

interface DashboardStats {
  eventsCount: number;
  usersCount: number;
  categoriesCount: number;
  parsedQueueCount: number;
}

const AdminDashboardPage: React.FC = () => {
  const { session } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    eventsCount: 0,
    usersCount: 0,
    categoriesCount: 0,
    parsedQueueCount: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const [events, users, categories, parsed] = await Promise.all([
          fetchEvents(session),
          fetchUsers(session),
          fetchEventCategories(session),
          fetchParsedEvents({ limit: 1, offset: 0 }, session),
        ]);
        const parsedTotal = Number(parsed?.total || 0);
        setStats({
          eventsCount: events.length,
          usersCount: users.length,
          categoriesCount: categories.length,
          parsedQueueCount: parsedTotal,
        });
      } catch (err: any) {
        setError(err?.message || 'Не удалось загрузить статистику');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [session]);

  if (loading) {
    return (
      <Flex align="center" justify="center" py={20}>
        <Spinner size="lg" color="#AFC7FF" />
      </Flex>
    );
  }

  return (
    <VStack align="stretch" gap={6}>
      {error ? (
        <Box
          bg="rgba(255, 93, 93, 0.14)"
          border="1px solid rgba(255, 122, 122, 0.5)"
          color="#FFD1D1"
          borderRadius="12px"
          p={4}
        >
          {error}
        </Box>
      ) : null}

      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }} gap={4}>
        <AdminStatCard
          title="Мероприятий на сайте"
          value={String(stats.eventsCount)}
          hint="GET /event/events"
          icon={FiActivity}
          delay={0}
        />
        <AdminStatCard
          title="Пользователей"
          value={String(stats.usersCount)}
          hint="GET /user/all"
          icon={FiUsers}
          delay={0.05}
        />
        <AdminStatCard
          title="Категорий"
          value={String(stats.categoriesCount)}
          hint="GET /event/event_list"
          icon={FiDatabase}
          delay={0.1}
        />
        <AdminStatCard
          title="Записей в staging"
          value={String(stats.parsedQueueCount)}
          hint="GET /parser/events"
          icon={FiCpu}
          delay={0.15}
        />
      </Grid>

      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        bg="rgba(26, 31, 59, 0.9)"
        border="1px solid rgba(141, 158, 255, 0.24)"
        borderRadius="16px"
        p={5}
      >
        <Text color="white" fontSize="18px" fontWeight="700" mb={3}>
          Быстрые действия
        </Text>
        <HStack gap={3} flexWrap="wrap">
          <Link to="/admin/events">
            <Button bg="#4C6BE6" color="white" _hover={{ bg: '#6f8dff' }}>
              К мероприятиям
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button bg="#4C6BE6" color="white" _hover={{ bg: '#6f8dff' }}>
              К пользователям
            </Button>
          </Link>
          <Link to="/admin/parser">
            <Button bg="#4C6BE6" color="white" _hover={{ bg: '#6f8dff' }}>
              Управлять парсером
            </Button>
          </Link>
          <Link to="/admin/ai">
            <Button bg="#4C6BE6" color="white" _hover={{ bg: '#6f8dff' }}>
              Обновить embeddings
            </Button>
          </Link>
        </HStack>
      </MotionBox>
    </VStack>
  );
};

export default AdminDashboardPage;
