import { Box, Button, Flex, Spinner, Text, Textarea, VStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { triggerAssistantReindex } from '../services/adminApi';
import { useAdminAuth } from '../app/AdminAuthContext';

const AdminAiPage: React.FC = () => {
  const { session } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const runReindex = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await triggerAssistantReindex(session);
      setResult(response);
      setBlocked(false);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404 || status === 405) {
        setBlocked(true);
        setError(
          'Ручка /assistant/reindex пока недоступна в текущем backend. Кнопка будет активирована после добавления endpoint.'
        );
      } else {
        setError(err?.message || 'Не удалось запустить reindex');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runReindex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VStack align="stretch" gap={4}>
      <Box
        bg="rgba(26, 31, 59, 0.9)"
        border="1px solid rgba(141, 158, 255, 0.24)"
        borderRadius="16px"
        p={5}
      >
        <Text color="white" fontSize="17px" fontWeight="700" mb={2}>
          Обновление embeddings (`POST /assistant/reindex`)
        </Text>
        <Text color="gray.300" fontSize="13px" mb={4}>
          Раздел запускает существующую ручку переиндексации векторной базы. Если endpoint отсутствует,
          кнопка остаётся заблокированной до доработки backend.
        </Text>
        <Flex gap={2}>
          <Button
            bg="#4C6BE6"
            color="white"
              loading={loading}
            onClick={runReindex}
            disabled={blocked}
          >
            Обновить embeddings
          </Button>
          {loading ? <Spinner color="#AFC7FF" /> : null}
        </Flex>
      </Box>

      {error ? (
        <Box bg="rgba(255,93,93,0.15)" border="1px solid rgba(255,93,93,0.45)" borderRadius="12px" p={3} color="#ffd1d1">
          {error}
        </Box>
      ) : null}

      <Box
        bg="rgba(26, 31, 59, 0.9)"
        border="1px solid rgba(141, 158, 255, 0.24)"
        borderRadius="16px"
        p={4}
      >
        <Text color="white" fontSize="15px" fontWeight="700" mb={2}>
          Последний ответ API
        </Text>
        <Textarea
          readOnly
          minH="320px"
          bg="#0E1226"
          color="#CDE1FF"
          fontFamily="mono"
          fontSize="12px"
          value={JSON.stringify(result, null, 2)}
        />
      </Box>
    </VStack>
  );
};

export default AdminAiPage;
