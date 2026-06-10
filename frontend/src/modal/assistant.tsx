import { Box, Button, Flex, Text, Input,Image } from '@chakra-ui/react';
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
    text?: string;
    matches?: MatchEvent[];
};

const AiAssistantModal = ({ isOpen, onClose }: Props) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            type: 'assistant',
            text: 'Привет. Я твой ИИ помощник. Могу рассказать о мероприятиях, которые сейчас проходят в городе, найти интересное событие и ответить на вопросы. Чем могу помочь?',
        },
    ]);

    const [value, setValue] = useState('');

    const chatRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        if (!chatRef.current) return;

        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    };

    const handleSend = async () => {
        if (!value.trim()) return;

        const userMessage = value;

        setMessages(prev => [
            ...prev,
            {
                id: Date.now(),
                type: 'user',
                text: userMessage,
            },
        ]);

        setValue('');

        try {
            const response = await axios.post(
                '/assistant/chat',
                {
                    message: userMessage,
                    top_k: 5,
                }
            );
            console.log('AI RESPONSE:', response.data);
            const data = response.data;

            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    type: 'assistant',
                    text: data.message,
                    matches: data.matches || [],
                },
            ]);

        } catch (error) {
            console.error('Ошибка AI assistant:', error);

            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    type: 'assistant',
                    text: 'Произошла ошибка при обращении к ИИ.',
                },
            ]);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    
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
        justify={
            message.type === 'user'
                ? 'flex-end'
                : 'flex-start'
        }
        mb={4}
        fontSize="15px"
    >
        <Box
            maxW="75%"
            px={5}
            py={4}
            borderRadius="16px"
            bg={
                message.type === 'user'
                    ? '#0C0066'
                    : 'rgb(255, 255, 255)'
            }
            color={
                message.type === 'user'
                    ? 'white'
                    : 'black'
            }
        >
            {message.text && (
                <Text mb={message.matches?.length ? 4 : 0}>
                    {message.text}
                </Text>
            )}

            {message.matches?.map(event => (
                <Text key={event.event_id}>
                    • {event.name}
                </Text>
            ))}
            </Box>
        </Flex>
    ))}
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
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    handleSend();
                                }
                            }}
                        />

                        <Button
                            className="send-button"
                            onClick={handleSend}
                            bg="#0C0066"
                            borderRadius="10px"
                        >
                            Отправить
                        </Button>
                    </Flex>
                    
                </Box>
                
            </Box>
        </Modal>
    );
};

export default AiAssistantModal;