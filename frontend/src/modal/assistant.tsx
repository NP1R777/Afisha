import { Box, Button, Flex, Text, Input, Image } from '@chakra-ui/react';
import Modal from 'react-modal';
import { useRef, useEffect, useState } from 'react';
import assistant from '../pictures/assistant2.png';
import background from '../pictures/background2.png';
import axios from '../shared/lib/axios';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

type MatchEvent = {
    event_id: number;
    name: string;
    description: string;
    organization: string;
    city: string;
    price: number | null;
    pictures_main: string | null;
    external_url: string;
    date_event: string | null;
};

type Message = {
    id: number;
    type: 'assistant' | 'user';
    text: string;
    matches?: AssistantMatch[];
};

type AssistantMatch = {
    event_id: number;
    name: string;
    city?: string | null;
    price?: number | null;
    address?: string | null;
    date_event?: string | null;
    start_time?: string | null;
    pictures_main?: string | null;
};

type AssistantChatResponse = {
    message: string;
    matches: AssistantMatch[];
    warnings: string[];
};

const AiAssistantModal = ({ isOpen, onClose }: Props) => {
    const messageIdRef = useRef(3);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            type: 'assistant',
            text: 'Привет. Я твой ИИ помощник. Могу рассказать о мероприятиях, которые сейчас проходят в городе, найти интересное событие и ответить на вопросы. Чем могу помочь?',
        },
    ]);

    const [value, setValue] = useState('');
    const [isSending, setIsSending] = useState(false);

    const chatRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        if (!chatRef.current) return;

        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    };

    const nextMessageId = () => {
        messageIdRef.current += 1;
        return messageIdRef.current;
    };

    const formatEventDate = (match: AssistantMatch) => {
        if (!match.date_event) return null;
        const parsedDate = new Date(match.date_event);
        if (Number.isNaN(parsedDate.getTime())) return null;
        const dateLabel = parsedDate.toLocaleDateString('ru-RU');
        return match.start_time ? `${dateLabel}, ${match.start_time}` : dateLabel;
    };

    const formatEventPrice = (price?: number | null) => {
        if (price === null || price === undefined) return 'Цена уточняется';
        if (Number(price) === 0) return 'Бесплатно';
        return `от ${price} ₽`;
    };

    const handleSend = async () => {
        const requestText = value.trim();
        if (!requestText || isSending) return;

        const userMessage = value;

        setMessages(prev => [
            ...prev,
            {
                id: nextMessageId(),
                type: 'user',
                text: requestText,
            },
        ]);
        setValue('');
        setIsSending(true);

        try {
            const response = await axios.post<AssistantChatResponse>('/assistant/chat', {
                message: requestText,
                top_k: 4,
            });
            const responseData = response.data;
            const warnings = Array.isArray(responseData.warnings) ? responseData.warnings : [];
            const warningBlock = warnings.length ? `\n\n${warnings.join('\n')}` : '';

            setMessages(prev => [
                ...prev,
                {
                    id: nextMessageId(),
                    type: 'assistant',
                    text: `${responseData.message || 'Не удалось получить ответ от ассистента.'}${warningBlock}`,
                    matches: Array.isArray(responseData.matches) ? responseData.matches : [],
                },
            ]);
        } catch (error: any) {
            const apiMessage = error?.response?.data?.detail;
            const fallbackMessage = typeof apiMessage === 'string'
                ? apiMessage
                : 'Не удалось получить ответ ассистента. Попробуйте ещё раз.';

            setMessages(prev => [
                ...prev,
                {
                    id: nextMessageId(),
                    type: 'assistant',
                    text: fallbackMessage,
                },
            ]);
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isSending]);

    
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={{
                overlay: {
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    zIndex: 1000,
                },
                content: {
                    inset: '50% auto auto 50%',
                    transform: 'translate(-50%, -50%)',
                    padding: 0,
                    border: 'none',
                    borderRadius: '36px',
                    maxWidth: '760px',
                    width: '90%',
                    background: '#1D1B2E',
                    overflow: 'hidden',
                },
            }}
        >

            <Box p={6} fontFamily="Unbounded">
                {/* HEADER */}
                <Flex align="center" gap={4} mb={6}>
                    <Image
                    src={assistant}
                    alt="assistant"
                    maxW={{ base: '120px', md: '180px', lg: '70px' }}
                    pointerEvents="none"
                    userSelect="none"
                    />

                    <Box color="white" >
                        <Text className="assistant-title" fontSize="25px">
                            ИИ ассистент
                        </Text>

                        <Text className="assistant-subtitle">
                            Твой помощник по мероприятиям в городе
                        </Text>
                    </Box>
                </Flex>

                {/* CHAT */}
                <Box
                    bgImage={`url(${background})`}
                    borderRadius="24px"
                    overflow="hidden"
                    bgSize="cover"
                    backgroundPosition="center"
                    p={4}
                    mb={1}
                    w="700px"
                    h="500px"
                    ml="6px"
                    display="flex"
                    flexDirection="column"
                >
               
                    <Flex
                        ref={chatRef}
                        direction="column"
                        flex="1"
                        overflowY="auto"
                    >
                    {messages.map(message => (
                        <Flex
                            key={message.id}
                            justify={message.type === 'user' ? 'flex-end' : 'flex-start'}
                            mb={4}
                            fontSize="15px"
                        >
                            <Box
                                maxW={message.type === 'assistant' && message.matches?.length ? '80%' : '55%'}
                                px={5}
                                py={4}
                                borderRadius="16px"
                                bg={message.type === 'user' ? '#0C0066' : 'rgb(255, 255, 255)'}
                                color={message.type === 'user' ? 'white' : 'black'}
                            >
                                <Text whiteSpace="pre-wrap">{message.text}</Text>
                                {message.type === 'assistant' && message.matches?.length ? (
                                    <Flex direction="column" gap={2} mt={3}>
                                        {message.matches.map((match) => (
                                            <Box
                                                key={`${message.id}-${match.event_id}-${match.start_time || ''}`}
                                                bg="#EEF2FF"
                                                border="1px solid #D8E0FF"
                                                borderRadius="12px"
                                                p={2}
                                            >
                                                <Flex gap={2} align="flex-start">
                                                    {match.pictures_main ? (
                                                        <Image
                                                            src={match.pictures_main}
                                                            alt={match.name}
                                                            width="52px"
                                                            height="52px"
                                                            objectFit="cover"
                                                            borderRadius="8px"
                                                            flexShrink={0}
                                                        />
                                                    ) : null}
                                                    <Box minW={0} flex={1}>
                                                        <Text
                                                            fontSize="12px"
                                                            fontWeight="700"
                                                            lineClamp={2}
                                                        >
                                                            {match.name}
                                                        </Text>
                                                        <Text fontSize="11px" color="#2F3A70" mt={1} lineClamp={1}>
                                                            {formatEventDate(match) || match.city || 'Дата уточняется'}
                                                        </Text>
                                                        <Text fontSize="11px" color="#2F3A70" lineClamp={1}>
                                                            {formatEventPrice(match.price)}
                                                        </Text>
                                                        {match.address ? (
                                                            <Text fontSize="10px" color="#4A558A" lineClamp={1}>
                                                                {match.address}
                                                            </Text>
                                                        ) : null}
                                                        <Button
                                                            size="xs"
                                                            mt={2}
                                                            bg="#0C0066"
                                                            color="white"
                                                            _hover={{ bg: '#171173' }}
                                                            onClick={() => {
                                                                window.location.href = `/event/${match.event_id}`;
                                                            }}
                                                        >
                                                            Открыть
                                                        </Button>
                                                    </Box>
                                                </Flex>
                                            </Box>
                                        ))}
                                    </Flex>
                                ) : null}
                            </Box>
                        </Flex>
                    ))}
                    {isSending ? (
                        <Flex justify="flex-start" mb={4} fontSize="15px">
                            <Box
                                maxW="55%"
                                px={5}
                                py={3}
                                borderRadius="16px"
                                bg="rgb(255, 255, 255)"
                                color="black"
                            >
                                Ассистент думает...
                            </Box>
                        </Flex>
                    ) : null}
                    </Flex>

                    {/* INPUT */}
                    <Flex gap={3}
                        align="center">
                        <Input
                            value={value}
                            bg="#FFFFFF"
                            borderRadius="10px"
                            onChange={e => setValue(e.target.value)}
                            placeholder="Сообщение..."
                            className="message-input"
                            disabled={isSending}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />

                        <Button
                            className="send-button"
                            onClick={handleSend}
                            bg="#0C0066"
                            borderRadius="10px"
                            disabled={isSending}
                        >
                            {isSending ? '...' : 'Отправить'}
                        </Button>
                    </Flex>
                    
                </Box>
                
            </Box>
        </Modal>
    );
};

export default AiAssistantModal;