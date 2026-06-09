import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Input,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { AdminCategory, AdminEvent } from '../types/models';
import { createEvent, fetchEventCategories, fetchEvents } from '../services/adminApi';
import { useAdminAuth } from '../app/AdminAuthContext';

const MotionBox = motion(Box);

interface CreateEventForm {
  name: string;
  description: string;
  organization: string;
  city: string;
  price: string;
  address: string;
  age_limit: string;
  pictures_main: string;
  pictures_two: string;
  external_url: string;
  date_event: string;
  start_time: string;
}

const initialCreateForm: CreateEventForm = {
  name: '',
  description: '',
  organization: '',
  city: '',
  price: '',
  address: '',
  age_limit: '',
  pictures_main: '',
  pictures_two: '',
  external_url: '',
  date_event: '',
  start_time: '',
};

const AdminEventsPage: React.FC = () => {
  const { session } = useAdminAuth();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateEventForm>(initialCreateForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsData, categoriesData] = await Promise.all([
        fetchEvents(session),
        fetchEventCategories(session),
      ]);
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err?.message || 'Не удалось загрузить мероприятия');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((item) => item.name.toLowerCase().includes(query.toLowerCase().trim()));
  }, [events, query]);

  const handleCreateSubmit = async () => {
    setSuccess(null);
    setError(null);
    if (!createForm.name.trim()) {
      setError('Для создания мероприятия нужно заполнить поле "Название".');
      return;
    }
    if (!createForm.date_event || !createForm.start_time) {
      setError('Для создания требуется хотя бы один слот времени (дата и время).');
      return;
    }
    if (selectedCategoryIds.length === 0) {
      setError('Выберите минимум одну категорию.');
      return;
    }

    setCreating(true);
    try {
      await createEvent(
        {
          name: createForm.name.trim(),
          description: createForm.description || undefined,
          organization: createForm.organization ? Number(createForm.organization) : null,
          city: createForm.city || null,
          price: createForm.price ? Number(createForm.price) : null,
          address: createForm.address || null,
          age_limit: createForm.age_limit || null,
          pictures_main: createForm.pictures_main || null,
          pictures_two: createForm.pictures_two || null,
          external_url: createForm.external_url || null,
          group_ids: selectedCategoryIds,
          times: [
            {
              date_event: new Date(createForm.date_event).toISOString(),
              start_time: createForm.start_time,
            },
          ],
        },
        session
      );
      setSuccess('Мероприятие успешно создано.');
      setCreateForm(initialCreateForm);
      setSelectedCategoryIds([]);
      setShowCreate(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Не удалось создать мероприятие');
    } finally {
      setCreating(false);
    }
  };

  return (
    <VStack align="stretch" gap={4}>
      <Flex justify="space-between" gap={3} wrap="wrap">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по названию"
          maxW="360px"
          bg="white"
          color="black"
        />
        <Flex gap={2}>
          <Button onClick={() => setShowCreate((prev) => !prev)} bg="#4C6BE6" color="white">
            {showCreate ? 'Скрыть форму' : 'Создать мероприятие'}
          </Button>
          <Button disabled bg="gray.600" color="gray.200" title="Endpoint update/delete пока отсутствует">
            Edit/Delete (скоро)
          </Button>
        </Flex>
      </Flex>

      {error ? (
        <Box bg="rgba(255,93,93,0.15)" border="1px solid rgba(255,93,93,0.45)" borderRadius="12px" p={3} color="#ffd1d1">
          {error}
        </Box>
      ) : null}
      {success ? (
        <Box bg="rgba(69,181,116,0.15)" border="1px solid rgba(69,181,116,0.45)" borderRadius="12px" p={3} color="#bff8d2">
          {success}
        </Box>
      ) : null}

      {showCreate ? (
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          bg="rgba(26, 31, 59, 0.9)"
          border="1px solid rgba(141, 158, 255, 0.24)"
          borderRadius="16px"
          p={5}
        >
          <Text color="white" fontSize="17px" fontWeight="700" mb={4}>
            Создание мероприятия (по существующей ручке `/event/create_event`)
          </Text>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
            {(
              [
                ['name', 'Название'],
                ['description', 'Описание'],
                ['organization', 'ID организации'],
                ['city', 'Город (norilsk, talnah...)'],
                ['price', 'Цена'],
                ['address', 'Адрес'],
                ['age_limit', 'Возрастной лимит'],
                ['pictures_main', 'Основная картинка URL'],
                ['pictures_two', 'Доп. картинка URL'],
                ['external_url', 'Ссылка на событие'],
              ] as const
            ).map(([key, label]) => (
              <Input
                key={key}
                value={createForm[key]}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, [key]: event.target.value }))}
                placeholder={label}
                bg="white"
                color="black"
              />
            ))}
            <Input
              type="date"
              value={createForm.date_event}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, date_event: event.target.value }))}
              bg="white"
              color="black"
            />
            <Input
              type="time"
              value={createForm.start_time}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, start_time: event.target.value }))}
              bg="white"
              color="black"
            />
          </Grid>

          <Box mt={4}>
            <Text color="gray.300" fontSize="13px" mb={2}>
              Категории
            </Text>
            <Flex wrap="wrap" gap={3}>
              {categories.map((category) => {
                const checked = selectedCategoryIds.includes(category.id);
                return (
                  <Button
                    key={category.id}
                    size="sm"
                    variant={checked ? 'solid' : 'outline'}
                    bg={checked ? '#4C6BE6' : 'transparent'}
                    color={checked ? 'white' : 'gray.200'}
                    borderColor="rgba(183, 197, 255, 0.35)"
                    onClick={() => {
                      setSelectedCategoryIds((prev) =>
                        checked
                          ? prev.filter((id) => id !== category.id)
                          : Array.from(new Set([...prev, category.id]))
                      );
                    }}
                  >
                    {category.name}
                  </Button>
                );
              })}
            </Flex>
          </Box>

          <Flex mt={4} gap={2}>
            <Button onClick={handleCreateSubmit} bg="#4C6BE6" color="white" loading={creating}>
              Создать
            </Button>
            <Button
              variant="outline"
              borderColor="gray.500"
              color="gray.200"
              onClick={() => {
                setCreateForm(initialCreateForm);
                setSelectedCategoryIds([]);
              }}
            >
              Очистить
            </Button>
          </Flex>
        </MotionBox>
      ) : null}

      <Box
        bg="rgba(26, 31, 59, 0.9)"
        border="1px solid rgba(141, 158, 255, 0.24)"
        borderRadius="16px"
        p={4}
      >
        <Text color="white" fontSize="16px" fontWeight="700" mb={3}>
          Список мероприятий
        </Text>

        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner color="#AFC7FF" />
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Box as="table" w="100%" fontSize="13px" borderCollapse="collapse">
              <Box as="thead">
                <Box as="tr">
                  {['ID', 'Название', 'Город', 'Цена', 'Дата/время', 'Статус'].map((title) => (
                    <Box as="th" key={title} textAlign="left" color="gray.300" py={2} pr={3}>
                      {title}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {filteredEvents.map((item) => {
                  const firstSlot = item.time_slots?.[0];
                  return (
                    <Box as="tr" key={item.id} borderTop="1px solid rgba(255,255,255,0.07)">
                      <Box as="td" py={2} pr={3} color="gray.200">
                        {item.id}
                      </Box>
                      <Box as="td" py={2} pr={3} color="white" fontWeight="600">
                        {item.name}
                      </Box>
                      <Box as="td" py={2} pr={3} color="gray.200">
                        {item.city || '—'}
                      </Box>
                      <Box as="td" py={2} pr={3} color="gray.200">
                        {item.price !== null && item.price !== undefined ? `${item.price} ₽` : '—'}
                      </Box>
                      <Box as="td" py={2} pr={3} color="gray.200">
                        {firstSlot ? `${new Date(firstSlot.date_event).toLocaleDateString()} ${firstSlot.start_time}` : '—'}
                      </Box>
                      <Box as="td" py={2} pr={3}>
                        <Badge colorPalette="orange" variant="subtle">
                          edit/delete недоступно
                        </Badge>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </VStack>
  );
};

export default AdminEventsPage;
