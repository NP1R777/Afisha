import { Box, Flex, Heading, Button, Image } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import axios from '../shared/lib/axios';
import icon from '../pictures/icon.png';
import Modal from 'react-modal';
import { useUser } from '../addition/context';
import { useNavigate } from 'react-router-dom';

interface Category {
  id: number;
  name: string;
}
interface CategoriesModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onRequestClose }) => {
  const { userId } = useUser();
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const handleCategoryClick = (value: string) => {
    setSelectedCategories(prev => (prev.includes(value) ? prev.filter(category => category !== value) : [...prev, value]));
  };

  useEffect(() => {

    const fetchCategories = async () => {

      try {

        const response = await axios.get(
          '/event/event_list'
        );

        console.log(
          'CATEGORIES:',
          response.data
        );

        setCategories(response.data);

      } catch (error) {

        console.error(
          'Ошибка загрузки категорий:',
          error
        );
      }
    };

    fetchCategories();

  }, []);

  const handleSubmit = async () => {

    if (!userId) {
      console.error('User ID not found');
      return;
    }

    const selectedCategoryIds = selectedCategories
      .map(categoryName => {

        const item = categories.find(
          item => item.name === categoryName
        );

        return item ? item.id : null;
      })
      .filter(id => id !== null);

    try {

      await axios.patch(
        `/user/update_preferences?user_id=${userId}`,
        {
          preferences: selectedCategoryIds,
        }
      );

      onRequestClose();

      navigate('/account');

    } catch (error) {

      console.error(
        'Ошибка при обновлении категорий:',
        error
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Categories Modal"
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 100,
        },
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '0',
          background: 'none',
          border: 'none',
          overflow: 'visible'
        },
      }}
    >
      <Box
        bg="gray.800"
        borderRadius="20px"
        padding={{ base: '20px',sm: '25px', md:'35px',lg:'50px'}}
        width={{ base: '300px', sm: '400px', md:'550px',lg:'730px'}}
        boxShadow="0px 4px 32px rgba(0, 0, 0, 0.25)"
        textAlign="center"
        mt="50px"
        mb="50px"
        
      >
        <Flex justifyContent="center" alignItems="center" marginBottom="10px">
          <Image src={icon} alt="Logo" boxSize={{ base: '45px', md:'50px',lg:'70px'}} objectFit="contain" />
        </Flex>
        <Heading as="h1" color="white" fontSize={{ base: '16px',sm: '17px', md:'28px',lg:'31px'}} fontWeight="900" mb="3" userSelect="none" fontFamily="Unbounded" lineHeight="1.2">
          Выберите интересующие вас <br />
          категории мероприятий
        </Heading>
        <Flex wrap="wrap" justify="center" gap={5} mt="20px" >
          {categories.map(item => (
            <Button
              key={item.id}
              onClick={() => handleCategoryClick(item.name)}
              bg="#FFFFFF"
              color="#22212C"
              fontSize={{ base: '15px', md:'17px',lg:'19px'}}
              fontWeight="600"
              padding="15px"
              px={5}
              py={6}
              boxShadow={selectedCategories.includes(item.name) ? '0px 0px 0px 4px #7296CC, 0px 0px 15px rgba(0, 123, 255, 0.75)' : 'none'}
              _hover={{
                boxShadow: '0px 0px 0px 4px #7296CC, 0px 0px 15px rgba(0, 123, 255, 0.75)',
              }}
              borderRadius="10px"
              width="auto"
            >
              {item.name}
            </Button>
          ))}
        </Flex>
        <Flex w="100%" mt="20px" justifyContent="center">
          <Button
            type="submit"
            bg="#A0B1CC"
            color="white"
            fontSize={{ base: '22px', md: '26px', lg: '23px' }}
            fontWeight="600"
            fontFamily="Unbounded"
            px={8}
            py={7}
            boxShadow="0px 4px 32px rgba(114, 150, 204, 0.5)"
            _hover={{ bg: '#7296CC' }}
            width={{ base: '180px', md: '240px', lg: '260px' }}
            borderRadius="14px"
            onClick={handleSubmit}
          >
            Готово!
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};

export default CategoriesModal;