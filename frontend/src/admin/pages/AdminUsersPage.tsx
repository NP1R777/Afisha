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
import { useEffect, useMemo, useState } from 'react';
import type { AdminCategory, AdminUser, UserRole } from '../types/models';
import {
  changeUserRole,
  deleteUser,
  fetchEventCategories,
  fetchUsers,
  updateUser,
} from '../services/adminApi';
import { useAdminAuth } from '../app/AdminAuthContext';

interface EditForm {
  userId: number | null;
  username: string;
  email: string;
  password: string;
  date_of_birth: string;
  preferences: number[];
  role: UserRole;
}

const initialEditForm: EditForm = {
  userId: null,
  username: '',
  email: '',
  password: '',
  date_of_birth: '',
  preferences: [],
  role: 'user',
};

const AdminUsersPage: React.FC = () => {
  const { session } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(initialEditForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, categoriesData] = await Promise.all([
        fetchUsers(session),
        fetchEventCategories(session),
      ]);
      setUsers(usersData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err?.message || 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) {
      return users;
    }
    return users.filter(
      (item) =>
        item.username.toLowerCase().includes(normalized) ||
        String(item.email || '')
          .toLowerCase()
          .includes(normalized)
    );
  }, [query, users]);

  const startEditUser = (user: AdminUser) => {
    setError(null);
    setSuccess(null);
    setEditForm({
      userId: user.id,
      username: user.username || '',
      email: user.email || '',
      password: '',
      date_of_birth: user.date_of_birth || '',
      preferences: Array.isArray(user.preferences) ? user.preferences : [],
      role: user.role || 'user',
    });
  };

  const handleSave = async () => {
    if (!editForm.userId) {
      setError('Сначала выберите пользователя для редактирования.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUser(
        editForm.userId,
        {
          username: editForm.username || undefined,
          email: editForm.email || undefined,
          password: editForm.password || undefined,
          date_of_birth: editForm.date_of_birth || undefined,
          preferences: editForm.preferences,
        },
        session
      );
      await changeUserRole(editForm.userId, editForm.role, session);
      setSuccess('Данные пользователя обновлены.');
      setEditForm((prev) => ({ ...prev, password: '' }));
      await loadData();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : (err?.message || 'Не удалось сохранить изменения пользователя')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Удалить пользователя? Действие необратимо.')) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await deleteUser(userId, session);
      setSuccess('Пользователь удалён.');
      if (editForm.userId === userId) {
        setEditForm(initialEditForm);
      }
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Не удалось удалить пользователя');
    }
  };

  return (
    <Grid templateColumns={{ base: '1fr', xl: '1.35fr 1fr' }} gap={4}>
      <Box
        bg="rgba(26, 31, 59, 0.9)"
        border="1px solid rgba(141, 158, 255, 0.24)"
        borderRadius="16px"
        p={4}
      >
        <Flex justify="space-between" align="center" mb={3} gap={3} wrap="wrap">
          <Text color="white" fontSize="16px" fontWeight="700">
            Пользователи
          </Text>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск"
            maxW="320px"
            bg="white"
            color="black"
          />
        </Flex>

        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner color="#AFC7FF" />
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Box as="table" w="100%" fontSize="13px" borderCollapse="collapse">
              <Box as="thead">
                <Box as="tr">
                  {['ID', 'Логин', 'Email', 'Роль', 'Действия'].map((title) => (
                    <Box as="th" key={title} textAlign="left" color="gray.300" py={2} pr={3}>
                      {title}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {filteredUsers.map((user) => (
                  <Box as="tr" key={user.id} borderTop="1px solid rgba(255,255,255,0.07)">
                    <Box as="td" py={2} pr={3} color="gray.200">
                      {user.id}
                    </Box>
                    <Box as="td" py={2} pr={3} color="white">
                      {user.username}
                    </Box>
                    <Box as="td" py={2} pr={3} color="gray.200">
                      {user.email || '—'}
                    </Box>
                    <Box as="td" py={2} pr={3}>
                      <Badge colorPalette={user.role === 'admin' ? 'green' : 'gray'}>
                        {user.role || 'не определена'}
                      </Badge>
                    </Box>
                    <Box as="td" py={2} pr={3}>
                      <Flex gap={2}>
                        <Button size="xs" bg="#4C6BE6" color="white" onClick={() => startEditUser(user)}>
                          Редактировать
                        </Button>
                        <Button size="xs" bg="#C84E4E" color="white" onClick={() => handleDelete(user.id)}>
                          Удалить
                        </Button>
                      </Flex>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <VStack
        align="stretch"
        gap={3}
        bg="rgba(26, 31, 59, 0.9)"
        border="1px solid rgba(141, 158, 255, 0.24)"
        borderRadius="16px"
        p={4}
      >
        <Text color="white" fontSize="16px" fontWeight="700">
          Редактирование пользователя
        </Text>

        <Input
          value={editForm.username}
          onChange={(event) => setEditForm((prev) => ({ ...prev, username: event.target.value }))}
          placeholder="Логин"
          bg="white"
          color="black"
        />
        <Input
          value={editForm.email}
          onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="Email"
          bg="white"
          color="black"
        />
        <Input
          value={editForm.password}
          onChange={(event) => setEditForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="Новый пароль (опционально)"
          type="password"
          bg="white"
          color="black"
        />
        <Input
          type="date"
          value={editForm.date_of_birth}
          onChange={(event) => setEditForm((prev) => ({ ...prev, date_of_birth: event.target.value }))}
          bg="white"
          color="black"
        />

        <Box>
          <Text color="gray.300" fontSize="13px" mb={2}>
            Предпочитаемые категории
          </Text>
          <Flex wrap="wrap" gap={2}>
            {categories.map((category) => {
              const checked = editForm.preferences.includes(category.id);
              return (
                <Button
                  key={category.id}
                  size="sm"
                  variant={checked ? 'solid' : 'outline'}
                  bg={checked ? '#4C6BE6' : 'transparent'}
                  color={checked ? 'white' : 'gray.200'}
                  borderColor="rgba(183, 197, 255, 0.35)"
                  onClick={() =>
                    setEditForm((prev) => ({
                      ...prev,
                      preferences: checked
                        ? prev.preferences.filter((id) => id !== category.id)
                        : [...prev.preferences, category.id],
                    }))
                  }
                >
                  {category.name}
                </Button>
              );
            })}
          </Flex>
        </Box>

        <Box>
          <Text color="gray.300" fontSize="13px" mb={2}>
            Роль пользователя
          </Text>
          <Flex gap={2} wrap="wrap">
            {(['user', 'admin', 'organizator'] as UserRole[]).map((role) => {
              const checked = editForm.role === role;
              return (
                <Button
                  key={role}
                  size="sm"
                  variant={checked ? 'solid' : 'outline'}
                  bg={checked ? '#4C6BE6' : 'transparent'}
                  color={checked ? 'white' : 'gray.200'}
                  borderColor="rgba(183, 197, 255, 0.35)"
                  onClick={() => setEditForm((prev) => ({ ...prev, role }))}
                >
                  {role}
                </Button>
              );
            })}
          </Flex>
        </Box>

        {error ? (
          <Text color="#ffd1d1" fontSize="13px">
            {error}
          </Text>
        ) : null}
        {success ? (
          <Text color="#bff8d2" fontSize="13px">
            {success}
          </Text>
        ) : null}

        <Flex gap={2}>
          <Button bg="#4C6BE6" color="white" onClick={handleSave} loading={saving}>
            Сохранить
          </Button>
          <Button
            variant="outline"
            borderColor="gray.500"
            color="gray.200"
            onClick={() => setEditForm(initialEditForm)}
          >
            Сброс
          </Button>
        </Flex>
      </VStack>
    </Grid>
  );
};

export default AdminUsersPage;
