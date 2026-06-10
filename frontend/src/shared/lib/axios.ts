import Axios from 'axios';
import { API_URL } from '../config';

export default Axios.create({
  baseURL: API_URL,
});
