--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS hakaton;
--
-- Name: hakaton; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE hakaton WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'ru-RU';


\connect hakaton

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: application_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.application_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: city_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.city_enum AS ENUM (
    'norilsk',
    'talnah',
    'kayerkan',
    'oganeer',
    'dudinka'
);


--
-- Name: parsed_process_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.parsed_process_status_enum AS ENUM (
    'new',
    'processed',
    'rejected',
    'error'
);


--
-- Name: parsed_target_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.parsed_target_type_enum AS ENUM (
    'event',
    'news',
    'unknown'
);


--
-- Name: role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role_enum AS ENUM (
    'user',
    'admin',
    'organizator'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    update_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    deleted_at timestamp without time zone,
    name character varying NOT NULL,
    description character varying,
    group_id integer,
    external_url character varying,
    date_event date,
    location character varying,
    duration time without time zone,
    city character varying,
    price integer,
    address character varying,
    age_limit character varying,
    picture_url character varying,
    horizontal_picture_url character varying
);


--
-- Name: event_groups_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_groups_event (
    event_id integer NOT NULL,
    groups_id integer NOT NULL
);


--
-- Name: event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_id_seq OWNED BY public.event.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    update_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp without time zone,
    name character varying NOT NULL,
    description character varying,
    organization integer,
    city public.city_enum,
    price double precision,
    address character varying,
    age_limit character varying,
    pictures_main character varying,
    pictures_two character varying,
    external_url text
);


--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: group_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_event (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    update_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    deleted_at timestamp without time zone,
    name character varying NOT NULL,
    description character varying
);


--
-- Name: group_event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_event_id_seq OWNED BY public.group_event.id;


--
-- Name: groups_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups_event (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    update_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp without time zone,
    name character varying NOT NULL,
    description character varying
);


--
-- Name: groups_event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.groups_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.groups_event_id_seq OWNED BY public.groups_event.id;


--
-- Name: info_org; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.info_org (
    id integer NOT NULL,
    user_id integer,
    organization character varying,
    phone_number character varying
);


--
-- Name: info_org_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.info_org_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: info_org_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.info_org_id_seq OWNED BY public.info_org.id;


--
-- Name: info_organization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.info_organization (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    update_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp without time zone,
    name_org character varying NOT NULL,
    address character varying,
    organizator character varying,
    description text,
    picture_org character varying,
    external_url text
);


--
-- Name: info_organization_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.info_organization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: info_organization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.info_organization_id_seq OWNED BY public.info_organization.id;


--
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    update_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp without time zone,
    name character varying NOT NULL,
    address character varying,
    organizator character varying,
    organization integer
);


--
-- Name: news_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_id_seq OWNED BY public.news.id;


--
-- Name: organizer_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizer_applications (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp without time zone,
    user_id integer NOT NULL,
    status public.application_status DEFAULT 'pending'::public.application_status NOT NULL,
    message text,
    review_comment text,
    reviewed_by integer,
    reviewed_at timestamp without time zone
);


--
-- Name: organizer_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.organizer_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: organizer_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.organizer_applications_id_seq OWNED BY public.organizer_applications.id;


--
-- Name: parsed_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parsed_event (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    update_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    deleted_at timestamp without time zone,
    source_key character varying NOT NULL,
    source_name character varying NOT NULL,
    name character varying NOT NULL,
    description character varying,
    date_event character varying,
    duration character varying,
    city character varying,
    price character varying,
    address character varying,
    organization character varying,
    age_limit character varying,
    external_url character varying,
    target_type public.parsed_target_type_enum DEFAULT 'unknown'::public.parsed_target_type_enum NOT NULL,
    process_status public.parsed_process_status_enum DEFAULT 'new'::public.parsed_process_status_enum NOT NULL,
    processed_at timestamp without time zone,
    error_text text,
    pictures_main character varying,
    pictures_two character varying,
    start_time character varying
);


--
-- Name: parsed_event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parsed_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: parsed_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parsed_event_id_seq OWNED BY public.parsed_event.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    update_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp without time zone,
    user_id integer NOT NULL,
    role public.role_enum DEFAULT 'user'::public.role_enum NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: times_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.times_event (
    id integer NOT NULL,
    event_id integer NOT NULL,
    date_event timestamp without time zone NOT NULL,
    start_time time without time zone NOT NULL
);


--
-- Name: times_event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.times_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: times_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.times_event_id_seq OWNED BY public.times_event.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    update_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    deleted_at timestamp without time zone,
    username character varying NOT NULL,
    password_hash character varying NOT NULL,
    preferences integer[],
    refresh_token character varying,
    email character varying,
    is_org boolean,
    date_of_birth character varying,
    like_events integer[]
);


--
-- Name: user_groups_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_groups_event (
    user_id integer NOT NULL,
    groups_id integer NOT NULL
);


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: user_to_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_to_event (
    user_id integer NOT NULL,
    event_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    update_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    update_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp without time zone,
    username character varying NOT NULL,
    password_hash character varying NOT NULL,
    email character varying NOT NULL,
    date_of_birth date NOT NULL,
    refresh_token character varying
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: event id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event ALTER COLUMN id SET DEFAULT nextval('public.event_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: group_event id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_event ALTER COLUMN id SET DEFAULT nextval('public.group_event_id_seq'::regclass);


--
-- Name: groups_event id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups_event ALTER COLUMN id SET DEFAULT nextval('public.groups_event_id_seq'::regclass);


--
-- Name: info_org id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.info_org ALTER COLUMN id SET DEFAULT nextval('public.info_org_id_seq'::regclass);


--
-- Name: info_organization id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.info_organization ALTER COLUMN id SET DEFAULT nextval('public.info_organization_id_seq'::regclass);


--
-- Name: news id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news ALTER COLUMN id SET DEFAULT nextval('public.news_id_seq'::regclass);


--
-- Name: organizer_applications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_applications ALTER COLUMN id SET DEFAULT nextval('public.organizer_applications_id_seq'::regclass);


--
-- Name: parsed_event id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parsed_event ALTER COLUMN id SET DEFAULT nextval('public.parsed_event_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: times_event id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.times_event ALTER COLUMN id SET DEFAULT nextval('public.times_event_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alembic_version (version_num) FROM stdin;
48f31dbfc437
\.


--
-- Data for Name: event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event (id, created_at, update_at, deleted_at, name, description, group_id, external_url, date_event, location, duration, city, price, address, age_limit, picture_url, horizontal_picture_url) FROM stdin;
2	2026-04-23 09:02:22.667966	2026-04-23 09:02:22.667966	\N	Спектакль Голубцы по объявлению	Это хороший спектакль про абсурдную ситуацию, произошедшую в одной простой на вид семье	1	string	2026-04-23	Норильск	09:01:26.39	string	100	string	string	string	string
\.


--
-- Data for Name: event_groups_event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_groups_event (event_id, groups_id) FROM stdin;
1	1
1	2
2	1
3	5
5	5
6	5
7	1
7	2
8	1
8	2
10	5
11	1
11	2
12	1
12	2
13	1
13	2
16	1
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, created_at, update_at, deleted_at, name, description, organization, city, price, address, age_limit, pictures_main, pictures_two, external_url) FROM stdin;
1	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Экскурсия «Закулисье»	Описание Галерея Рецензии Билеты Экскурсия «Закулисье» интерактивный спектакль Экскурсия «Закулисье» интерактивный спектакль Как устроен самый северный театр? Что такое реквизит? Сколько людей трудится над созданием одной постановки? Что находится под сценой театра? Сколько этажей в здании? Об этом вам расскажут артисты театра, приоткрыв завесу тайны. Маршрут будет лежать через основную сцену и ее закулисье: вы узнаете о техническом оснащении сцены, увидите «святую святых» – актерские гримерки с теми самыми столиками с лампочками, как в кино. Вы побываете в пошивочном, бутафорском и декорационном цехах. После такой экскурсии просмотр спектаклей заиграет новыми красками! Для групп от 15 человек возможна организация индивидуального посещения (требуется предварительная запись по телефону администратора). Подробнее о проведении и условиях можно узнать по телефонам: Администратор – +7 (3919) 22-70-43 Билетная касса – +7 (3919) 22-68-69 Купить билет Купить билет Сцена Малая сцена Время 1 час Галерея Все фотографии Отзывы Экскурсия очень понравилась! Давно хотелось побывать на "другой стороне". Сколько труда, людей задействовано в подготовке постановок кроме артистов! Столько оборудования, реквизита, и всё должно работать. Провел экскурсию Владислав Молдованов, он просто умница! Спасибо ему большое! Хочется выразить благодарность всем работникам нашего замечательного театра за возможность побывать по другую сторону зрительного зала! Юлия 05.05.2026 Билеты 24 июня среда Экскурсия «Закулисье» интерактивный спектакль 15:00 Купить билет Частые вопросы У меня возникли проблемы при покупке электронного билета, что делать? При возникновении вопросов и затруднений в процессе покупки электронных билетов (если вам не пришло электронное письмо с файлом билета или вы его потеряли/случайно удалили) для оперативного их решения обращайтесь в службу поддержки билетного оператора ИНТИКЕТС ( +7 (495) 225-54-22 ) Нужно ли распечатывать электронный билет? Для посещения мероприятия необходимо предъявить электронный билет либо в виде распеченного бланка либо в виде PDF-документа с читаемым штрихкодом/QR-кодом на экране мобильного устройства. Исключением является время отсутствия интернета, когда контролеры не могут считать ваш QR-код сканером. В этом случае Вас попросят распечатать билет в кассе театра. Как вернуть или обменять билеты? Возврат билетов по инициативе зрителя возможен по заявлению зрителя в соответствии с Федеральным законом № 193-ФЗ от 18.07.2019 г. При этом возвращается: • не позднее 10 дней до мероприятия — 100% от стоимости; • менее 10 дней, но не позднее 5 дней до дня мероприятия — 50% от стоимости; • менее 5 дней, но не позднее 3 дней до дня мероприятия — 30% от стоимости; • менее 3 дней до дня мероприятия возврат не осуществляется. Возврат билетов происходит по месту приобретения. Чтобы оформить возврат через кассу театра, вам необходимо предоставить заявление о возврате , оригинал неиспользованного билета, кассовый чек, а также сопутствующие документы при необходимости. Срок принятия решения о возврате не превышает 10-ти дней со дня приема заявления. В случае положительного решения Театр осуществляет возврат денежных средств не позднее 10-ти дней со дня принятия решения. Для возврата электронных билетов, приобретенных на официальном сайте Театра, необходимо воспользоваться сервисом возврата билетов . В случае приобретения электронных билетов, а также билетов с использованием банковских карт на сайте и в кассе театра, срок возврата денежных средств за такие билеты может быть увеличен до 45 дней. Если мероприятие отменено по инициативе Театра, то возврат билета осуществляется по полной стоимости. Для решения вопроса в частном порядке можно связаться с администратором. С более подробной информацией о порядке возврата билетов вы можете ознакомиться прочитав «Правила продажи театральных билетов». Нужен ли билет ребёнку, и с какого возраста? Для посещения спектаклей ребенку до 3-х лет билет не нужен, так как он занимает одно место с сопровождающим. По достижению 3-х летнего возраста билет полагается и ребенку и сопровождающему. Как купить билет по Пушкинской карте? Приобрести билет по Пушкинской карте можно на сайте Театра. При оплате необходимо указать «Пушкинской картой». Рекомендуем к проСмотру Экскурсия «История театра» интерактивный спектакль	1	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/9c920d436df5ebb9f101fcd3717002774700c7bb9547bcf0a903adb13a49ee84.png	http://localhost:9000/afisha-images/events/detail/4e879190c9e41bfa1ebcac7f24ec6adb4e5ffba8b8ffb2c0d2188a841c2e197c.jpg	https://www.northdrama.ru/repertuar/ekskursiya-zakulise
2	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Капитанская дочка	Сезон закроется премьерой спектакля «Капитанская дочка» по одноименному роману А.С. Пушкина и драматической поэме С.А. Есенина . Спектакль тематически, содержательно, идейно поддержит линию «Княжны Таракановой…» в нашем репертуаре: он о Русском бунте — «бессмысленном и беспощадном», и о большой любви, которая «сильнее смерти». Он о нашей истории, проходящей по судьбам людей порой огромным пыточным колесом и оставляющей глубокие незаживающие шрамы в сердцах и памяти. Он о трагическом нравственном выборе между долгом и личным чувством. О чести и подлости, о верности и предательстве. Об очистительной силе Добра и Благодарности в помыслах и поступках человеческих. «История народа принадлежит поэту» — эта пушкинская формула из письма Н.И. Гнедичу, обозначает его творческое кредо в осмыслении, интерпретации событий прошлого. По Пушкину, именно Поэт-Пророк может интуитивно понять, почувствовать, провидеть — «куда влечет нас рок событий» , бесхитростно оценить историческую роль/перспективу того или иного персонажа общественной жизни. Литературная фантазия авторов будущего спектакля сулит нам встречу сразу двух известнейших русских Поэтов, разных эпох и стилистических пристрастий, — в оценке одного исторического/культурного персонажа: Емельяна Пугачева, предводителя Крестьянской войны второй половины XVIII века, человека неординарного, даже таинственного, жизнь и смерть которого притягивали внимание многих на протяжении веков. Ему посвящены монография «История Пугачевского бунта» (1834) и роман «Капитанская дочка» (1836) А.С. Пушкина, драматическая поэма «Пугачев» С.А. Есенина (1921), о нем так остро и проникновенно написала Марина Цветаева: «В «Капитанской дочке» Пушкин под чару Пугачева подпал и до последней строки из-под нее не вышел… Чара дана и пронесена сквозь все встречи, — с Вожатым, с Самозванцем — на крыльце, с Самозванцем пирующим, с Пугачевым — сказывающим сказку, с Пугачевым карающим, с Пугачевым прощающим, с Пугачевым — в последний раз кивающим… с плахи… В самозванце-Емельяне Пушкин отвел душу от самодержца-Николая, не сумевшего его ни обнять, ни отпустить…» И понятно, почему так притягательны для Поэта эти черные глаза, ласковая, но зловещая улыбка: Все, все, что гибелью грозит, Для сердца смертного таит Неизъяснимы наслажденья – Бессмертья, может быть, залог… Впрочем, Пушкин-прозаик все-таки реалист: он видит обреченность крестьянского бунта и его лидера, указывает на авантюрность, жестокость всех планов, деяний Пугачева… И тем именно заслуживает упрек/возражение поэта Есенина, предположившего, что взгляд дворянина на крестьянского царя все же не проникает вглубь явления, что автор «Капитанской дочки» слишком сосредоточен на усмирителях восстания и его жертвах, а приглядеться/прислушаться следует к восставшим – они крупные яркие герои, среди них Пугачев — настоящий романтический персонаж, вообще «почти гениальный человек», так что и революция 1917 года, и крестьянские волнения 20-х годов ХХ века – это «второе пришествие Пугача». В нашем будущем спектакле эти две стороны социального противостояния – дворяне и крестьяне – по-настоящему заговорят «на разных языках». Дворянам будут отданы слова А.С. Пушкина-реалиста, взятые из романа и значимых для постановки стихотворений (причем, воспоминания постаревшего П.А. Гринева о мятежной юности зазвучат в исполнении… Народного артиста СССР И.М. Смоктуновского). А мужицкая стихия взметнется стихами С.А. Есенина-имажиниста, ярко эмоциональными, насыщенными сложнейшими метафорами, необычными инверсиями. Таким образом в ткань спектакля войдет история восстания и «воцарения» Пугачева, которой фактически нет в романе «Капитанская дочка». Легкая поступь пушкинской лиры, преисполненной, впрочем, ощущением трагичности бытия, — и разбойная удаль есенинских строк, где в каждом слове автор ощущал «кровь и мясо»: «вдавив в землю ступни и пятки, крепко стоит мой стих». Такова сложнейшая партитура ожидающего нас «состязания поэтов»… Впрочем, не забудем и про дочь капитана Миронова – ту образно-сюжетную линию, которую Пушкин так мучительно искал, а Есенин так неистово отрицал («В моей трагедии вообще нет ни одной бабы… Они тут совсем не нужны: пугачевщина – не бабий бунт»). Пусть спорщиков примирит перспектива: грандиозная трагедия пугачевщины – зловещая черная дыра на ткани жизни. А чистые, ясные, бесхитростные души незаметных героев и героинь, таких, как Миронов, его жена и дочь, — благая весть для тех, кто все же верит в живительную силу Добра. Таким был Пушкин. К этому пробивался сквозь тьму тяжелых мыслей Есенин. Да и Пугачеву, нет-нет, а нестерпимо требовалось порой согреться теплом «заячьего тулупчика» с чужого плеча;))) До встречи на премьере! Все Описание	1	norilsk	\N	\N	12+	http://localhost:9000/afisha-images/events/main/a6cbd78d4339fbb6e5b55b0c18bfed8ad95838aaf2a4585267dd1c453db71ea6.jpg	http://localhost:9000/afisha-images/picture1.png	https://www.northdrama.ru/repertuar/kapitanskaya-dochka-spektakl-po-odnoimennomu-romanu-a-s-pushkina-i-dramaticheskoj-poeme-s-a-esenina-pugachev
3	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	22 июня 1941 года	Сегодня, 22 июня, ранним утром на площади Памяти Героев у Вечного огня состоялось памятное мероприятие, посвящённое 85-й годовщине начала Великой Отечественной войны. Именно в 8:00 часов по норильскому времени началось вторжение гитлеровской Германии в Советский союз, перечеркнувшее планы на светлое будущее и судьбы миллионов людей. Впереди были 1418 дней и ночей страданий, боли, потерь и войны. Представители Администрации города Норильска, депутаты Норильского городского Совета депутатов, сотрудники органов внутренних дел и силовых структур, участники движения «Юнармия», работники подведомственных учреждений и жители города — вместе вспомнили подвиг советского народа и почтили минутой молчания и оружейным залпом память тех, кто ценой жизни защитил наше Отечество. Перед Вечным огнём были выстроены из горящих свечей слова «Норильск помнит» и почётный знак «Город трудовой доблести». Гости церемонии так же зажгли и возложили свечи памяти и цветы. Памятное мероприятие прошло в рамках всероссийских акций «Свеча памяти», которая проходит по всей стране с 2009 года, и «Огненные картины войны». По традиции, в этот день каждый желающий может зажечь свою свечу памяти — дома или в организации — как символ скорби и вечной памяти о 27 миллионах соотечественников, погибших в годы Великой Отечественной войны. В 12:15 по московскому времени по всей стране прошла масштабная акция, посвящённая памяти жертв Великой Отечественной войны, – Всероссийская акция «Минута молчания». Выбор времени проведения акции неслучаен – именно в этот день в 12 часов 15 минут в 1941 году в эфире вышло обращение правительства к гражданам Советского Союза о нападении нацистской Германии. На одну минуту жизнь в стране замерла прекратили работу кассы в торговых центрах, остановился общественный транспорт и личные автомобили, на предприятиях, где позволяет технологический процесс, приостановилось работа. Вечная память Героям, вечная слава защитникам Родины!	2	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/9d2d7116f688b08f209a84dbd763647995e099e8c49776c627f4bd4e9f235db0.jpg	http://localhost:9000/afisha-images/picture1.png	http://www.gcknorilsk.ru/22-iyunya-1941-goda/
4	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Аншлаг на «Движение севера»	Уважаемые жители и гости Норильска! К сожалению, билеты на необычный квартирник «Движение севера» 14 июня в 18:00 в Городском центре культуры закончились! Аншлаг.	2	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/8d6d40169ab9e08fd7e2dc768be50a8aa4ea938424913fce02f0a5feab268450.jpg	http://localhost:9000/afisha-images/picture1.png	http://www.gcknorilsk.ru/anshlag-na-dvizhenie-severa/
5	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Акция «Пушкинские выходные»: вместе и с выгодой!	Городской центр культуры присоединяется к краевой акции «Пушкинские выходные» для владельцев «Пушкинской карты». При покупке билета на мероприятие, которое будет проходить в субботу или воскресенье, или в дни государственных праздников и школьных каникул, вы получаете возможность приобрести дополнительный билет на это же мероприятие со скидкой 25% для ваших родителей! Следите за анонсами наших мероприятий! Важные условия участия в акции: владелец «Пушкинской карты» обязан предъявить свой паспорт; родители должны предоставить документ, удостоверяющий личность; иметь при себе документ, подтверждающий родство с ребёнком. Как принять участие в акции: приобретите билет по «Пушкинской карте»; забронируйте билеты для родителей одним из способов: позвоните в кассу по телефону 22-99-14 или посетите кассу лично; получите скидку 25% на билеты для родителей при выкупе билета в кассе. Скидка для родителей работает только тогда, когда вы идёте вместе! Все подробности – в положении . До встречи в Городском центре культуры! #Пушкинскаякарта #Пушкинскиевыходные	2	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/847c581fe713356cf16d9d0f546fddbd7eba7f7f0acb7b506d28391940404650.jpg	http://localhost:9000/afisha-images/picture1.png	http://www.gcknorilsk.ru/akciya-pushkinskie-vyxodnye-vmeste-i-s-vygodoj/
6	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Наш дом — Россия!	12 июня – День России, День рождения нашей страны. Это особенный праздник, который объединяет все города и регионы нашей любимой Родины. 2026 год объявлен Президентом РФ Владимиром Владимировичем Путиным Годом единства народов России, а значит и мероприятия, посвящённые главному празднику российской государственности, предстоят масштабные. В 11:00, впервые в День России, на главной площади города развернётся настоящий гастрономический фестиваль. Угощения русской и других национальных кухонь будут радовать гостей праздника до самого вечера. В 13:00 пройдет торжественное открытие 56 сезона трудовых отрядов школьников. В 13:30 на площади Комсомольской начнётся праздничная программа «Наш дом – Россия!», и весь Норильск вместе с представителями национально-культурных объединений города исполнит Государственный гимн Российской Федерации. В это же время, впервые в День России на площади Гвардейской пройдут открытые спортивные турниры и соревнования для всех желающих от Управления по спорту Администрации города Норильска. Гостей и жителей Большого Норильска ждут следующие площадки: Стритбол; Футбол; Армрестлинг; Дартс; Силовой экстрим; Площадка ГТО; Шашки настольные; Дорожный патруль (электромобили). И конечно любимые гигантские игры для всех возрастов – дженга, боулинг, шашки и городки. Праздничный концерт на площади Комсомольской продлится до 19:00. С Днём России Норильск поздравят участники фестиваля «Край наш общий дом», а также хореографические и вокальные коллективы «Оганер», «Шкода», «Фристайл», «Болеро», «Voices» и «Вдохновение». Каждые 30 минут будут проходить конкурсно-развлекательные программы и розыгрыш ценных призов от Группы компаний «Жар. Птица». Для юных норильчан на площади будут проходить разные активности от аквагрима и «робосумо» до «палитры талантов» и «ЭКОквиза»! Приобрести праздничную атрибутику, сувениры, напитки и сладости можно будет в торговых точках, установленных здесь же. С 16:20 до 17:00 на праздничной сцене впервые пройдёт яркая и зажигательная танцевальная битва между лучшими танцорами и хореографическими коллективами города. А в 17:00 состоится розыгрыш целого миллиона в честь дня рождения Группы компаний «Жар. Птица». Завершит концертную программу «Наш дом – Россия!» выступление лучшего кавер-бенда Арктики «Red_O». Будем танцевать вместе со всей страной, отметим День России всем Норильском!	2	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/db0cd75a37772933b78ce804b5f5f553dba42e5115d09e420cd1d3b9bbea6b1b.jpg	http://localhost:9000/afisha-images/picture1.png	http://www.gcknorilsk.ru/nash-dom-rossiya/
7	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Поздравляем всех с Днём русского языка!	Праздник официально появился в России в 2011 году, а дата выбрана не случайно – 6 июня родился поэт, чьи произведения знают далеко за пределами страны и переводят на десятки языков мира. Даже если вы давно не открывали томик классики, с Пушкиным вы всё равно встречаетесь почти каждый день – в цитатах, мемах, экранизациях, спектаклях и в нашей программе «Пушкинская карта». Именно Пушкина называют создателем современного русского литературного языка, на котором мы сегодня шутим, пишем, признаёмся в любви и спорим. Так что сегодня – отличный повод перечитать любимые строки, посмотреть пару фильмов про гения, или послушать стихи, которые прочли для вас в разных учреждениях культуры края. Переходи по хэштегу #ЧитаемПушкинаНаЕнисее! #ПушкинскийДень2026 #ПушкинскаяКарта24 #6ИюняКрасноярскийКрай	2	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/267a12072c2cc8cb2460d7642058f1735bb50d65bef1662fda092547b0f4d45a.jpg	http://localhost:9000/afisha-images/picture1.png	http://www.gcknorilsk.ru/pozdravlyaem-vsex-s-dnyom-russkogo-yazyka/
8	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Посещение мероприятий семьями мобилизованных граждан, июнь 2026	Семьи лиц, участвующих в специальной военной операции, могут бесплатно посетить мероприятия и клубно-досуговые формирования Городского центра культуры. С Порядком бесплатного посещения семьями лиц, принимающих участие в специальной военной операции, культурных мероприятий всех форм, клубных формирований и кинопоказов, организуемых МБУК «Городской центр культуры» можно ознакомиться в подразделе «Услуги» раздела «О нас» нашего сайта или пройдя по ссылке . К членам семьи участников специальной военной операции относятся: • супруг/супруга; • несовершеннолетние дети и дети в возрасте до 23 лет, обучающиеся в образовательной организации по очной форме; • лицо, сопровождающее несовершеннолетних дети мобилизованного гражданина; • родители, совместно проживающие с участниками специальной военной операции. КАЛЕНДАРНЫЙ ПЛАН МЕРОПРИЯТИЙ МБУК «ГОРОДСКОЙ ЦЕНТР КУЛЬТУРЫ» НА ИЮНЬ 2026 ГОДА для посещения членами семей участников СВО на безвозмездной основе Дата Время начала Название мероприятия 14.06.2026 18:00 Творческий вечер косплееров «Движение севера» ПЕРЕЧЕНЬ КЛУБНЫХ ФОРМИРОВАНИЙ МБУК «ГОРОДСКОЙ ЦЕНТР КУЛЬТУРЫ» НА ИЮНЬ 2026 ГОДА для посещения членами семей участников СВО Название коллектива Возрастной рейтинг Свободные места Норильский хор «Вдохновение» 18+ 10 Театральная студия «ДА» 10-18 5 Городская академическая хоровая капелла 16+ 5 Народная самодеятельная студия Клуб флористов-дизайнеров «Галакс» 18+ 5 Клуб интеллектуальных игр «Что? Где? Когда?» 12-18 10 Норильская лига юмора 14+ 10 Танцевальный клуб «Вива» («Золотой возраст») 50+ 10 Творческая ассоциация норильских авторов и исполнителей (Клуб авторской песни) 16+ 10 Творческое объединение «Планёрка» 18+ 10 Творческое объединение «Атмосфера» 14+ 10 Творческое объединение «Киви» 14+ 10 Творческое объединение «Без границ» 14+ 5 Контакты для справочной информации и подачи заявок: Тел.: 8(3919)22-60-39, информационно-методический отдел Тел.: 8(3919)22-99-14, касса e-mail.: gck.kassa@mail.ru	2	norilsk	\N	\N	18+	http://localhost:9000/afisha-images/events/main/4a86b7fbb7bdcd1a3a803f6e639cb1c1d0827c9fba96478edb8e1f855944d59b.jpg	http://localhost:9000/afisha-images/picture1.png	http://www.gcknorilsk.ru/poseshhenie-meropriyatij-semyami-mobilizovannyx-grazhdan-iyun-2026/
9	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Вдохновленные Арктикой	Афиша мероприятий Музей Норильска вместе с другими музеями Красноярского края и шестью приглашенными художниками участвует в большом выставочном проекте «Идея Севера» . Выставка работает на крупнейшей в Сибири выставочной площадке современного искусства – в Музейном центре «Площадь Мира» (г. Красноярск) и занимает сразу два этажа. Арктика сейчас – территория стратегического внимания. Новый документально-художественный проект – многослойное высказывание о феномене Севера через современную музейную архитектуру, художественные инсталляции и музейные артефакты. Это пространственно-средовой рассказ об истории освоения экстремальных широт, ледоколах и подвигах, о жизни человека в условиях бескрайнего снега, льда и полярной ночи, о богатых ресурсах ещё недавно совсем не исследованной земли. Для выставки Музей Норильска отобрал более 300 снимков из фотофонда, образцы горных пород Таймыра из геолого-минералогической коллекции и шесть уникальных ровдужных картин Бориса Молчанова, выдающегося долганского художника, который еще при жизни стал известен на весь мир – именно картинами из ровдуги (оленьей замши), которые не имеют аналогов в мировом искусстве. Частью коллективной экспозиции стал и авторский фотопроект резидента Полярной арт-резиденции PolArt Марии Плотниковой «Магический реализм Заполярья» . «Наше картографическое или космографическое путешествие в Арктику мотивируется стремлением раскрыть Истину Севера как образ и смысл бытия, – говорит о проекте его куратор, арт-директор красноярского Музейного центра «Площадь Мира» Сергей Ковалевский. – Мы исходим из того, что значение духа и буквы Севера для роста человеческой личности еще неявное, но потенциально решающее. Особенно в такой северной стране, как Россия. Выставка пространств, соединения разных времен и разных видов искусств с вкраплениями документальных фактов и артефактов – это «из всех орудий салют» в сторону Севера». Выставку «Идея Севера» можно увидеть в Музейном центре «Площадь Мира» до 16 августа. Уточнить расписание и приобрести билеты можно заранее на сайте «Площади Мира» .	3	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/e5833a1a5bfeecef2887f78ec014fa1147ce8ab5cb8efd45338da1c6664f424c.jpg	http://localhost:9000/afisha-images/picture1.png	https://xn--h1aecgfmj1g.xn--p1ai/participate/61245/
10	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Спортивные мероприятия ко Дню России	Афиша мероприятий Уважаемые жители города Норильска, взрослые и дети, присоединяйтесь к масштабному событию! В программе: выставки, мастер-классы, песни, танцы и, конечно, же насыщенная и супер интересная спортивная площадка! Управление по спорту приглашает всех попробовать свои силы в различных видах спорта на результат, а также повеселиться с семьей и друзьями на интерактивных площадках. 12 июня 2026 года с 14:00 до 17:00 на территории Центрального района «площадь Гвардейская» запланировано проведение следующих спортивных мероприятий, посвященных Дню России: соревнования по стритболу 3х3; турнир по мини-футболу; турнир по армрестлингу; турнир по шашкам. Также в рамках мероприятия будут функционировать интерактивные площадки: народные игры: классики, резиночки, городки, бадминтон, скакалка для жителей города Норильска; дорожный патруль: электромобили, велосипеды для детей города Норильска; армтяга; дартс; силовой экстрим; площадка ГТО. Участвуй, побеждай, получай призы и отличное настроение!	3	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/6bc5f09639ffe61518e6cd3c565db1bf94c15a3057c47e53881a67f2affa4c1a.jpg	http://localhost:9000/afisha-images/picture1.png	https://xn--h1aecgfmj1g.xn--p1ai/participate/61213/
11	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	День России 2026	День России 2026 Печать Проведите День России вместе с кинокомплексом «Родина»! 🎬🍿 12 июня — особенный праздник, и мы приготовили для вас и ваших детей идеальную праздничную программу! Вас ждут любимые богатырские подвиги, море юмора и захватывающие исторические приключения: 🌟 12:00 — х/ф «Алеша Попович и Тугарин змей» (6+). Начнем день с легендарной истории о том, как Алеша Попович золото ростовское возвращал. Смех и отличное настроение гарантированы! 🌟 14:00 — х/ф «Добрыня Никитич и змей Горыныч» (6+). Продолжаем марафон вместе с рассудительным Добрыней, который отправляется на спасение княжеской племянницы Забавы. 🌟 15:30 — х/ф «Илья Муромец и Соловей Разбойник» (6+). Главный богатырь земли русской выходит на тропу справедливости, чтобы вернуть государственную казну и проучить коварного злодея. 🌟 17:00 — х/ф «Крепость: Щитом и мечом» (6+). Завершит наш праздничный показ вдохновляющая и героическая история о мужестве, преданности и защите родного Смоленска. Пригласительные билеты можно БЕСПЛАТНО получить в кассе кинокомплекса «Родина». Количество мест ограничено, лучше забрать билеты заранее ☺️ Подробности Опубликовано: 04 июня 2026 Просмотров: 56	4	norilsk	0	\N	6+	https://xn----8sblociwdfbv.xn--p1ai/images/icethumbs/212x315/100/images/Принцесса_цирка.jpg	http://localhost:9000/afisha-images/picture1.png	https://кино-родина.рф/
12	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Эхо IV Международного фестиваля фильмов для детей и юношества «Герой» к Международному дню защиты детей	Эхо IV Международного фестиваля фильмов для детей и юношества «Герой» к Международному дню защиты детей Печать Большой праздник кино для всей семьи ко Дню защиты детей! Друзья, 31 мая встречайте Эхо IV Международного фестиваля фильмов для детей и юношества «Герой». Это уникальная возможность увидеть лучшие новинки анимации на большом экране: 13:00 — «ЛУНТИК. ВОЗВРАЩЕНИЕ ДОМОЙ» . Любимый герой возвращается! Узнайте, какие новые приключения ждут Лунтика и его друзей. 15:00 — «ИВАН ЦАРЕВИЧ И СЕРЫЙ ВОЛК 6» . Продолжение любимой сказочной франшизы. Вас ждут юмор, магия и, конечно же, спасение Тридевятого царства! 17:00 — «ТРИ БОГАТЫРЯ. НИ ДНЯ БЕЗ ПОДВИГА» . Новые героические истории о самых известных богатырях. Смех и приключения гарантированы! Где: Видеозал кинокомплекса «Родина». Вход: по пригласительным билетам. Их можно получить бесплатно в кассе кинокомплекса. #событие_в_Родине Подробности Опубликовано: 28 мая 2026 Просмотров: 58	4	norilsk	0	\N	\N	https://xn----8sblociwdfbv.xn--p1ai/images/icethumbs/212x315/100/images/Принцесса_цирка.jpg	http://localhost:9000/afisha-images/picture1.png	https://кино-родина.рф/
13	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	День полярника 2026	День полярника 2026 Печать 🧊 Наш город — наши правила: празднуем День полярника в «Родине»! Пусть Норильск географически и не на самом полюсе, но дух Арктики у нас в крови! По традиции кинокомплекс «Родина» приглашает прикоснуться к тайнам ледяного континента на Всероссийской акции «День полярного кино». 23 мая наш видеозал превратится в портал за полярный круг. В программе — сразу три роскошных документальных хита, от которых побегут мурашки: 14:00 - «В прятки с полярными китами» Уже 30 лет российские океанологи проводят лето на Белом море у мыса Белуший. Сюда испокон веков приплывают белые киты. Удалось ли человеку наладить настоящий контакт с морскими гигантами? Узнаем вместе. 15:00 - «Ветреные будни». История выживания и веры на краю земли — острове Беринга (Командорские острова). Как ужиться с суровой, беспощадной стихией и не потерять себя? Главный герой — священник Владимир Миронов, приехавший служить в эту далекую точку планеты. Ожидание и реальность: совпали ли они на этот раз? 16:00 - «Белое безмолвие». Фильм-посвящение Николаю Евгенову — легендарному русскому гидрографу и исследователю Арктики. В основе картины — уникальные исторические хроники и редкие архивные кадры. Вы буквально почувствуете дыхание истории и вечных льдов. Как попасть? Вход бесплатный, но по пригласительным билетам. Забирайте свой билет на кассе «Родины», пока они есть в наличии! До встречи в кино! Подробности Опубликовано: 22 мая 2026 Просмотров: 65	4	norilsk	\N	\N	\N	https://xn----8sblociwdfbv.xn--p1ai/images/icethumbs/212x315/100/images/Принцесса_цирка.jpg	http://localhost:9000/afisha-images/picture1.png	https://кино-родина.рф/
14	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	ЕДИНСТВОМ СИЛЬНА РОССИЯ	Дорогие друзья! Приглашаем вас на Отчетный концерт творческих коллективов Норильской детской школы искусств, который состоится 25 апреля в 15.00ч! В отчетном концерте школы примут участие: -Ансамбли фортепианного отделения; -Оркестр русских народных инструментов (руководитель Рустам Шайхисламов); -Духовой оркестр (руководитель Михаил Захарьяш); -Камерный оркестр (руководитель Владимир Быкадоров); -Детские фольклорные ансамбли «Соловушки» (рук. Алена Сергейчик), «Горошины» (рук. Александра Качинская), «Карусель» (рук. Анна Шунц) - Сводный хор (рук. Ферида Зейналова и Валерия Плужник). Вход по пригласительным билетам (46-90-02)	6	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	https://nordshi.ru/item/2453804
15	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	НАШИ ДВЕРИ ВНОВЬ ОТКРЫТЫ!	18 апреля в 15:00 в Концертном зале школы искусств состоится концерт в рамках проведения Дня открытых дверей . Мы приглашаем юных норильчан и родителей стать частью нашей большой творческой семьи и предлагаем: познакомиться с палитрой и звучанием разнообразных музыкальных инструментов, определиться с выбором музыкального направления, вы сможете написать заявление в тот же день и получить информацию о работе приёмной комиссии. справки: 46-90-05, 8913-465-59-33. С нетерпением ждем вас!	6	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	https://nordshi.ru/item/2447590
16	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	НАЧИНАЕМ ГОД С ПРЕМЬЕРЫ!	20 января в Концертном зале школы искусств юные и взрослые норильчане побывают на премьере оперы-мюзикла С. Плешака "Золушка"! Это долгожданное событие является итогом большого творческого труда исполнителей. Историю Золушки при поддержке программы развития социального капитала "Люди территории" компании "Норникель" представят более 40 участников из числа учащихся школы искусств и преподавателей. Зрителей ждет волшебное представление, в котором соединяются воедино музыка, танец, вокальные и актерские способности участников, яркие костюмы и красочные декорации. На этой неделе пройдут генеральные репетиции оперы-мюзикла, каждая из которых приближает всех нас ко дню премьеры. До встречи в мире музыкального театра, дорогие друзья! Вход по пригласительным билетам (469002).	6	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	https://nordshi.ru/item/2382520
17	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	ЗИМНИЕ ЗАРИСОВКИ	Дорогие друзья! Осталось чуть более двух недель до наступления Нового года! Почувствовать атмосферу наступающего праздника в суматохе дел и в веренице событий бывает непросто. Самое время ощутить волшебное настроение зимнего праздника! Мы приглашаем юных и взрослых норильчан всей семьёй посетить новогодний концерт Образцового хореографического ансамбля "Созвездие " . Яркие образы, гирлянда танцевальных номеров в исполнении младшего, среднего и старшего состава ансамбля принесут вам незабываемые впечатления и подарят новогоднее настроение! Концерт состоится 20 декабря в 17 часов в Концертном зале школы искусств. Билеты в кассе НДШИ.	6	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	https://nordshi.ru/item/2365983
18	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	ЗИМНИЕ ЗАРИСОВКИ	Осталось совсем немного времени до волшебного дня, где вы сможете увидеть на сцене Концертного зала Норильской детской школы искусств выступление Образцового хореографического ансамбля "Созвездие! Кто ещё не успел приобрести билетики, звоните в кассу НДШИ по номеру 46-90-02 Будние дни с 9.00-17.00, перерыв с 13.00-14.00.	6	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	https://nordshi.ru/item/2082778
19	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	НОВОГОДНИЙ СЕРПАНТИН: ПРАЗДНИК НАЧИНАЕТСЯ ЗДЕСЬ!	Дорогие друзья! Наступает особенное время ожидания Нового года! С каждым днем декабря этот волшебный и по-настоящему семейный праздник становится ближе. И взрослые, и дети ждут его с радостным волнением, ведь в нем столько чудес и волшебства! Приглашаем разделить с нами предновогоднее настроение! Ждем вас 21 декабря в 14.00 и 17.00 часов на традиционном для школы искусств мероприятии «Новогодний серпантин!». Мы знаем, как создать праздничную атмосферу и сохранить её на все новогодние каникулы! Давайте заряжаться новогодним настроением вместе!Билеты можно приобрести в кассе НДШИ в будние дни с 9:00-17:00, обед 13:00-14:00 Тел. Кассы: 46-90-02 Цена билета: 300 рублей	6	norilsk	300	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	https://nordshi.ru/item/2076491
20	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	ПУТЕШЕСТВИЕ В БАБАРИЮ	23 ноября в Концертном зале школы искусств состоятся 2 концерта инструментального квартета с оригинальным названием «STRADIVALENKI» (Москва) в рамках просветительского проекта "Филармонические встречи" , который включает в себя цикл музыкальных вечеров. В 13:00 мы приглашаем школьников Норильска и учащихся образовательных учреждений культуры на интерактивную детскую музыкальную программу "Путешествие в Бабарию". В программе прозвучит музыка Ф. Пуленка, Й. Гайдна, Л. Дакена, К. Сен-Санса. Цена билета - 250руб. Билеты в кассе НДШИ: 46-90-02 Тел. для справок: 8-913-161-06-26 Чтобы приобрести билеты на вечерний концерт, смотрите следующую афишу.)	6	norilsk	250	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	https://nordshi.ru/item/2036910
21	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	КЛАССИКА, КОТОРАЯ УЛЫБАЕТСЯ	А в 18:00 музыканты выступят с концертной программой "Классика, которая улыбается" , которая будет интересна профессиональным музыкантам и любителям музыки. Норильчане смогут услышать произведения других не менее известных композиторов, среди которых: И.С. Бах, А. Вивальди, П. Чайковский, И. Брамс и другие. Дочитав этот пост, спешите сразу же приобрести билеты! До встречи на концертах современного музыкального коллектива с ярким тембровым звучанием и разнообразным репертуаром! Цена билета - 500руб. Билеты в кассе НДШИ: 46-90-02 Тел. для справок: 8-913-161-06-26	6	norilsk	500	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	https://nordshi.ru/item/2036909
22	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	ПУТЕШЕСТВИЕ ПО ЭПОХАМ	Уже в эту субботу (19 октября) в 17:00 состоится концерт лауреатов всероссийского и международного конкурсов с участием Подкаменной Катерины, Северухиной Александры, Семенец Любови и Литвинюк Людмилы класс преподавателя Афендиковой Ларисы Витальевны, а также преподаватель школы, незаменимый иллюстратор - Елена Анатольевна Чернышева. Приглашаем всех желающих стать поддержкой для наших вновь будущих юных конкурсанток и просто насладиться великолепной музыкой. Вход свободный. Тел. для справок: 89131610626	6	norilsk	0	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	https://nordshi.ru/item/2024665
23	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	МУЗЫКАЛЬНОЕ ПРИВЕТСТВИЕ	Дорогие друзья! Уже в эту субботу в 15 часов состоится "День открытых дверей". Откройте детям мир музыки и танца! А мы поможем вам сделать свой выбор!	6	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	https://nordshi.ru/item/1861368
24	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	ВРЕМЯ ТВОРИТЬ С НАМИ! НАБОР В НДШИ ОТКРЫТ!	Хотите, чтобы ваш ребенок не пропадал в телефоне, а создавал что-то прекрасное? Откройте ему особый мир искусства, творчества и магии сцены! Норильская детская школа искусств открывает набор на 2026/2027 учебный год по направлениям: музыкальное хореографическое Мы знаем все секреты вдохновения: Педагоги-профессионалы, мастера своего дела; уникальный Концертный зал - место, где раскрываются таланты; Творческая атмосфера концертов и конкурсов. Что важно сделать: Определиться с направлением Написать заявление. Наш адрес: ул. Б. Хмельницкого 17А, пн–пт с 09:00 до 17:00 (перерыв 13:00–14:00). Прием заявлений с 15 апреля ! Получить информацию о работе приёмной комиссии. Пройти прослушивание /отбор Справки: 46-90-05, 8913-495-59-33 Ждём вас! Искусство - фундамент успеха!	6	norilsk	\N	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	https://nordshi.ru/item/2438897
\.


--
-- Data for Name: group_event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_event (id, created_at, update_at, deleted_at, name, description) FROM stdin;
1	2025-09-12 08:28:24.687085	2025-09-12 08:28:24.687085	\N	Театр	Здесь всё про театр
\.


--
-- Data for Name: groups_event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groups_event (id, created_at, update_at, deleted_at, name, description) FROM stdin;
1	2026-06-23 13:11:05.075862	2026-06-23 13:11:05.075862	\N	Театр	Здесь всё про театр
2	2026-06-23 13:11:22.605158	2026-06-23 13:11:22.605158	\N	Кино	Здесь всё про кино
3	2026-06-23 13:11:36.653306	2026-06-23 13:11:36.653306	\N	Музыка	Здесь всё про музыку
4	2026-06-23 13:11:50.020107	2026-06-23 13:11:50.020107	\N	Культура	Здесь всё про культуру
5	2026-06-23 13:12:13.390395	2026-06-23 13:12:13.390395	\N	Спорт	Здесь всё про спорт
6	2026-06-23 13:12:29.772442	2026-06-23 13:12:29.772442	\N	Юмор	Здесь всё про юмор
7	2026-06-23 13:12:46.77945	2026-06-23 13:12:46.77945	\N	Образование	Здесь всё про образование
8	2026-06-23 13:13:09.23625	2026-06-23 13:13:09.23625	\N	Благотворительность	Здесь всё про благотворительность
9	2026-06-23 13:13:40.172316	2026-06-23 13:13:40.172316	\N	Городские праздники	Здесь всё про городские праздники
\.


--
-- Data for Name: info_org; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.info_org (id, user_id, organization, phone_number) FROM stdin;
\.


--
-- Data for Name: info_organization; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.info_organization (id, created_at, update_at, deleted_at, name_org, address, organizator, description, picture_org, external_url) FROM stdin;
1	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Заполярный театр драмы	\N	https://northdrama.ru	Норильский Заполярный театр драмы имени Вл. Маяковского — самый северный театр в мире и центр культурной жизни Норильска. Отличительная черта Норильска — его географическое положение. Театр всегда стремился к тому, чтобы северяне не ощущали оторванности от больших городов, интересных творческих событий. «Маяковка» неизменно сочетала возможности разных театральных направлений, жанров, стилей с тем, чтобы максимально удовлетворить потребности аудитории.	http://localhost:9000/afisha-images/organizations/7e74d5a254394cf0ede2a3b7c00e8eddfe8ee6325d0de05b0967904e4f50da75.png	https://northdrama.ru
2	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Городской центр культуры	663318, Красноярский край, г	http://www.gcknorilsk.ru/	Информация об Учреждении Городской центр культуры открылся в 1992 году и в настоящее время является одним из ведущих учреждений культурно-досуговой деятельности на территории Норильска. В 2018 году в МБУК «Городской центр культуры» создан филиал в поселке Снежногорск в результате реорганизации МБУК «ДК «Энергия». Учреждение располагае т Большим залом на 450 мест и Малым зрительным залом на 170 мест для проведения городских культурно-массовых мероприятий, а также Выставочным залом для проведения выставок, творческих встреч, вечеров и награждений. Городской центр культуры оснащен профессиональным звуковым и светотехническим оборудование м, светодиодными экранами размером 6х4,5м и 3х2м . В соответствии с Уставом Городской центр культуры осуществляет следующие основные виды деятельности: Создание и организация работы любительских творческих коллективов, кружков, студий, любительских объединений, клубов по интересам различной направленности и других клубных формирований; Проведение различных по форме и тематике культурно-массовых мероприятий — праздников, представлений, смотров, фестивалей, конкурсов, концертов, выставок, вечеров, спектаклей, игровых развлекательных программ и других форм показа результатов творческой деятельности клубных формирований; Проведение спектаклей, концертов и других культурно-зрелищных и выставочных мероприятий, в том числе с участием профессиональных кол лективов, исполнителей, авторов.	http://localhost:9000/afisha-images/picture1.png	http://www.gcknorilsk.ru/
3	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Администрация города Норильска	\N	https://xn--h1aecgfmj1g.xn--p1ai	Официальный сайт города Норильска	https://mc.yandex.ru/watch/97171419	https://xn--h1aecgfmj1g.xn--p1ai
4	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Кинотеатр Родина	\N	https://кино-родина.рф	Кинотеатр Родина (г. Норильск) - свежее расписание, афиша, акции!	https://xn----8sblociwdfbv.xn--p1ai/images/logored.png	https://кино-родина.рф
5	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru	Информация об организации отсутствует	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	https://talnah-dshi.ru
6	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Норильская детская школа искусств	\N	https://nordshi.ru	Информация об организации отсутствует	http://localhost:9000/afisha-images/organizations/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	https://nordshi.ru
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news (id, created_at, update_at, deleted_at, name, address, organizator, organization) FROM stdin;
1	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Как двигался север	\N	Городской центр культуры	2
2	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Успешное окончание учебного года отметили на сцене!	\N	Талнахская детская школа искусств	5
3	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	«Северные Истории»	\N	Талнахская детская школа искусств	5
4	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Поздравляем!	\N	Талнахская детская школа искусств	5
5	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Поздравляем Победителей!	\N	Талнахская детская школа искусств	5
6	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	«Корпорация звёзд»	\N	Талнахская детская школа искусств	5
7	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Поздравляем!!!	\N	Талнахская детская школа искусств	5
8	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	​ Поздравляем!!! ​	\N	Талнахская детская школа искусств	5
9	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Защита дипломных работ ДПОП "Живопись" 8 "В"	\N	Талнахская детская школа искусств	5
10	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Защита дипломных работ ДПОП "Живопись" 8 "Б"	\N	Талнахская детская школа искусств	5
11	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Защита диплома ДПОП "Дизайн"	\N	Талнахская детская школа искусств	5
12	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	Выпускные экзамены	\N	Талнахская детская школа искусств	5
13	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	​ «Музыкальные фантазии»: концерт, который ЖДАЛИ! ​	\N	Талнахская детская школа искусств	5
14	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	МАРШРУТ ПОСТРОЕН!	\N	Норильская детская школа искусств	6
15	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	ПОДВОДЯ ИТОГИ	\N	Норильская детская школа искусств	6
16	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	ДЕНЬ ТАТАРСКОЙ КУЛЬТУРЫ	\N	Норильская детская школа искусств	6
17	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	КЛАРНЕТ В ЦЕНТРЕ ВНИМАНИЯ	\N	Норильская детская школа искусств	6
18	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	МЫ МИР РАСКРАСИМ ГОЛОСАМИ	\N	Норильская детская школа искусств	6
19	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	ДАВАЙТЕ ИГРАТЬ ВМЕСТЕ	\N	Норильская детская школа искусств	6
20	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	ЮБИЛЕЙНЫЙ ТРИУМФ	\N	Норильская детская школа искусств	6
21	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	ГРОМКИЙ РИТМ ПОБЕДЫ	\N	Норильская детская школа искусств	6
22	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	МУЗЫКАЛЬНОЕ ВОСХОЖДЕНИЕ: Viva, symphony!	\N	Норильская детская школа искусств	6
23	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	"ВЕСЕННЯЯ КАРУСЕЛЬ" НАГРАЖДАЕТ ЛУЧШИХ!	\N	Норильская детская школа искусств	6
24	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	ПРИЗНАНИЕ ТАЛАНТА И ТРУДА	\N	Норильская детская школа искусств	6
25	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	В УНИСОН С УСПЕХОМ	\N	Норильская детская школа искусств	6
26	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	КОГДА ЗНАНИЯ ПРЕВРАЩАЮТСЯ В НАГРАДЫ	\N	Норильская детская школа искусств	6
27	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.344764	\N	МОГУЩЕСТВО ТЕОРИИ	\N	Норильская детская школа искусств	6
\.


--
-- Data for Name: organizer_applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizer_applications (id, created_at, updated_at, deleted_at, user_id, status, message, review_comment, reviewed_by, reviewed_at) FROM stdin;
\.


--
-- Data for Name: parsed_event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parsed_event (id, created_at, update_at, deleted_at, source_key, source_name, name, description, date_event, duration, city, price, address, organization, age_limit, external_url, target_type, process_status, processed_at, error_text, pictures_main, pictures_two, start_time) FROM stdin;
7	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	gck	Городской центр культуры	Норильчане дружно отпраздновали День России	12 июня – День России, День рождения нашей страны. Это особенный праздник, который объединяет все города и регионы нашей любимой Родины. В 2026 году в Норильске стали по-настоящему масштабными и объединили горожан всех поколений. Не самые благоприятные северные погодные условия не помешали отметить праздник весело, ярко и от всего сердца. В 11:00, впервые в День России, на главной площади города развернулся настоящий гастрономический фестиваль. Угощения радовали гостей праздника до самого вечера. Очередь к кухням не пустовала ни на минуту, а в центре гастрофестиваля царила атмосфера большого дружного застолья! В 13:00 состоялся символичный старт трудового лета для нашей молодёжи — торжественное открытие 56-го сезона трудовых отрядов школьников. Центром притяжения в 13:30 стала площадь Комсомольская, где началась праздничная программа «Наш дом — Россия!». Старт торжествам своим поздравлением дал лично Глава города Норильска Дмитрий Владимирович Карасёв, тепло поздравивший земляков с праздником и пожелавший городу благополучия, мира и любви. Весь Норильск вместе с представителями национально-культурных объединений города исполнил Государственный гимн Российской Федерации, и в этом моменте особенно зримо ощущалось то самое единство народов, которому посвящён нынешний год. В это же время площадь Гвардейская, впервые в День России, превратилась в большую спортивную арену: для всех желающих прошли открытые турниры и соревнования по стритболу, футболу, армрестлингу, дартсу и силовому экстриму, работали площадка ГТО, настольные шашки и «дорожный патруль» на электромобилях. А любимые гигантские игры для всех возрастов — дженга, боулинг, шашки и городки — собрали вокруг себя и детей, и взрослых. Праздничный концерт на Комсомольской площади продолжался до 19:00 и подарил норильчанам по-настоящему народную программу. Со сцены город поздравляли участники фестиваля «Край наш общий дом», а также лучшие творческие коллективы Норильска: хореографические ансамбли «Оганер», «Шкода», «Фристайл», «Болеро» и «Джэйран», вокальные коллективы «Voices» и ансамбль «Вдохновение». Каждые полчаса гостей ждали конкурсно-развлекательные программы и розыгрыши ценных призов от Группы компаний «Жар. Птица». Кульминацией праздника в 18:00 стало выступление лучшего кавер-бенда Арктики «Red_O». Авторские версии известных хитов в исполнении коллектива динамично и мощно завершили праздничную программу, и главная концертная площадь Норильска танцевала вместе со всей страной. День России-2026 в Норильске стал праздником единства, тепла и общей гордости за свою страну. Самый северный город страны доказал: какой бы ни была погода за окном, любовь к Родине согревает сердца и объединяет всех нас. С праздником, Норильск! Больше фото смотрите в нашем альбоме .	12.06.2026	11:00	Норильск	\N	\N	Городской центр культуры	\N	http://www.gcknorilsk.ru/norilchane-druzhno-otprazdnovali-den-rossii/	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/9c31a47c1327feea2fee849d4e77b357e050d0024a50593d1185b7000a8e21c6.jpg	http://localhost:9000/afisha-images/picture1.png	11:00
11	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	gck	Городской центр культуры	Социологический опрос	Уважаемые посетители! Приглашаем вас принять участие в независимой оценке качества оказания услуг МБУК «Городской центр культуры» (ул. Орджоникидзе, 15). Оставить своё мнение можно до 6 июля 2026 года. Для прохождения опроса, пожалуйста, пройдите по ссылке: https://docs.google.com/forms/d/e/1FAIpQLSdkrQqrXk4N5IYL6H4gi1U1bKj38do-ADKKpAY63H1GWp111A/viewform?usp=dialog Спасибо за участие!	06.07.2026	\N	Норильск	\N	ул. Орджоникидзе, 15	Городской центр культуры	\N	http://www.gcknorilsk.ru/sociologicheskij-opros-5/	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/29b6f5833f1e172b5731a9b510abd0178455a01ad22085878c3db8acbb4932d0.jpg	http://localhost:9000/afisha-images/picture1.png	\N
13	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	gck	Городской центр культуры	От прошлого к настоящему: как прозвучало «Эхо полувека»	30 мая в 17:00 в Концертном зале Норильской детской школы искусств состоялся юбилейный отчетный концерт Городской академической хоровой капеллы «Эхо полувека». Коллектив встретил знаковую дату — 50 лет беззаветной преданности искусству, бережного отношения к хоровым традициям. За это время Городская академическая хоровая капелла стала для горожан родной, прочно вписавшись в культурную карту города. Юбилейный вечер превратился в искреннее «спасибо» коллективу за долгий творческий путь и общий праздник, объединивший всех, кто ценит живое звучание. Слаженность голосов, виртуозное мастерство и проникновенность исполнения — визитная карточка капеллы. Юбилейный концерт «Эхо полувека» стал истинным подарком для всех поклонников хоровой музыки. Зал аплодировал стоя, подтверждая, что полвека на сцене — это не возраст, а вершина, с которой открываются новые горизонты. В рамках торжественного мероприятия коллектив получил памятные знаки признания заслуг. Почётную миссию вручения выполнил начальник управления по делам культуры и искусства Администрации города Норильска Давыдова Инна Александровна, которая от лица ведомства вручила памятный адрес, отражающий признание многолетней творческой работы капеллы, её роли в сохранении и популяризации вокально-хоровых традиций. Отдельно было отмечено профессиональное мастерство руководителя капеллы Натальи Михайловны Лушниковой, её вклад в развитие музыкального искусства и культурно-просветительскую деятельность.	30.05.2026	17:00	Норильск	\N	\N	Городской центр культуры	\N	http://www.gcknorilsk.ru/ot-proshlogo-k-nastoyashhemu-kak-prozvuchalo-exo-poluveka/	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/e61890e0200bfe807bd6b6480e21842eec9c9a78df79f6fdc4c8153c358acdd4.jpg	http://localhost:9000/afisha-images/picture1.png	17:00
15	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	norilsk_official	Официальный сайт города Норильска	Итоговая выставка Натальи Бочковой	Афиша мероприятий 18 июня в 18:30 Полярная арт-резиденция Музея Норильска (ул. Б. Хмельницкого, 1, 4-й подъезд, цоколь) приглашает на итоговую выставку резидента PolArt, документального фотографа и фотожурналиста Натальи Бочковой. «Изоляционный слой» – художественно-документальный проект о Норильске как о городе, существующем слоями. «Построенный на вечной мерзлоте, он складывается из природных, индустриальных, исторических и человеческих напластований, которые сосуществуют одновременно, но редко открываются целиком, – говорит Наталья. – Изоляция в Норильске – это не только про удаленность и труднодоступность. Изоляционный слой защищает от холода, удерживает тепло, сохраняет электричество и делает жизнь возможной в суровых условиях Севера. Он не только отделяет, но и помогает сохранить то, что иначе было бы утрачено. За внешней закрытостью города постепенно обнаруживаются его внутренние ресурсы: память, взаимопомощь, устойчивость и личные истории людей». Образ слоя Наталья Бочкова превратила в способ исследовать «изолированный» город. Продолжением ее исследования стала лаборатория с норильскими авторами , работающими с фотографией. Выставка объединяет взгляд резидента на Норильск, ее встречи с жителями – в серии портретов – и работы местных фотографов. Вход свободный. Событие организовано в рамках проекта «PolArt – AMMA. Развитие институций современного искусства в Норильске», реализуемого при поддержке Фонда целевого капитала «Наш Норильск» .	18.06.2026	18:30	Норильск	\N	\N	Администрация города Норильска	\N	https://xn--h1aecgfmj1g.xn--p1ai/participate/61287/	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/c7c753b99090e351807a7ecfa3c4df923e0c84eea786c59703d3e0eff153a50b.jpg	http://localhost:9000/afisha-images/picture1.png	18:30
17	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	norilsk_official	Официальный сайт города Норильска	Прием заявок на участие в «ТаймырФотоГода»	Афиша мероприятий Стартовал прием заявок на участие в фотовыставке «ТаймырФотоГода-2026». Выставка откроется ко Дню фотографа в юбилейный, десятый раз. Она сохраняет традиционный формат и позиционируется как ключевое ежегодное фотособытие на севере Красноярского края, представляющее актуальное творчество местных авторов. Неважно, снимаете вы на телефон или профессиональную камеру. Участниками коллективной выставки станут авторы самых оригинальных, эмоциональных, качественных работ, которые пройдут конкурсный отбор. В едином музейном выставочном пространстве могут встретиться фотосерии о городе и природе Таймыра, фоторассказы о жизни коренных малочисленных народов Севера, будни норильчан или другие самые неожиданные темы, предложенные авторами. Участие в выставке – возможность показать свое творчество широкой публике. Фотографии (до 2 Мб) вместе с заявкой присылайте по эл. адресу tfg2026@mail.ru до 15 июня включительно. В заявке важно указать ФИО, контактный телефон, название фотосерии, место и дату съемки, краткое описание события или художественного замысла. Условия участия читайте в положении о конкурсе , подробнее – на сайте Музея по ссылке .	15.06.2026	\N	Норильск	\N	\N	Администрация города Норильска	\N	https://xn--h1aecgfmj1g.xn--p1ai/participate/61033/	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/c75fe50bf516ca95f0960db5430bc8b46683c259f62a66e28c37725ce4de1660.jpg	http://localhost:9000/afisha-images/picture1.png	\N
19	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	cinema_arthall	Кинотеатр Арт-Холл	Закулисье реальности (дубляж)	\N	\N	20:55	Норильск	\N	\N	Кинотеатр Арт-Холл	18+	https://cinemaarthall.ru/schedule/cmm1t9zqohjup08292fhpx9it?cityId=cmhfv7olk6wd408294fjv9qpz	unknown	new	\N	\N	https://top-fwz1.mail.ru/counter?id=3612551;js=na	http://localhost:9000/afisha-images/picture1.png	20:55
20	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	cinema_arthall	Кинотеатр Арт-Холл	Оно. Ночной кошмар	\N	\N	23:05	Норильск	\N	\N	Кинотеатр Арт-Холл	18+	https://cinemaarthall.ru/schedule/cmpcmq0bsq2p00929w6l3nqry?cityId=cmhfv7olk6wd408294fjv9qpz	unknown	new	\N	\N	https://top-fwz1.mail.ru/counter?id=3612551;js=na	http://localhost:9000/afisha-images/picture1.png	23:05
21	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	cinema_arthall	Кинотеатр Арт-Холл	«Робоняня»	\N	\N	15:00	Норильск	\N	\N	Кинотеатр Арт-Холл	6+	https://cinemaarthall.ru/schedule/cmqgqt3yylazi0929fosxhjv3?cityId=cmhfv7olk6wd408294fjv9qpz	unknown	new	\N	\N	https://top-fwz1.mail.ru/counter?id=3612551;js=na	http://localhost:9000/afisha-images/picture1.png	15:00
22	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	cinema_rodina	Кинотеатр Родина	Независимая оценка качества 2026	Независимая оценка качества 2026 Печать Друзья, «Родина» проводит опрос! Мы хотим быть лучше для наших зрителей. А чтобы понять, каким в идеале видят кинокомплекс «Родина» наши гости, запустили анонимный опрос https://forms.yandex.ru/cloud/6a20ea4fe010db6f024d48ba и будем очень признательны за ваши ответы, друзья. Вопросы несложные, анкета займёшь лишь несколько минут. Спасибо за участие! Подробности Опубликовано: 09 июня 2026 Просмотров: 36	09.06.2026	\N	Норильск	\N	\N	Кинотеатр Родина	\N	https://кино-родина.рф/	unknown	new	\N	\N	https://xn----8sblociwdfbv.xn--p1ai/images/icethumbs/212x315/100/images/Принцесса_цирка.jpg	http://localhost:9000/afisha-images/picture1.png	\N
23	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	cinema_rodina	Кинотеатр Родина	Телефоны экстренных служб	Телефоны экстренных служб Печать Подробности Опубликовано: 19 мая 2026 Просмотров: 68	19.05.2026	\N	Норильск	\N	\N	Кинотеатр Родина	\N	https://кино-родина.рф/	unknown	new	\N	\N	https://xn----8sblociwdfbv.xn--p1ai/images/icethumbs/212x315/100/images/Принцесса_цирка.jpg	http://localhost:9000/afisha-images/picture1.png	\N
25	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	cinema_rodina	Кинотеатр Родина	IV Международный фестиваль фильмов для детей и юношества «Герой» - 2026	IV Международный фестиваль фильмов для детей и юношества «Герой» - 2026 Печать Подробности Опубликовано: 13 мая 2026 Просмотров: 70	13.05.2026	\N	Норильск	\N	\N	Кинотеатр Родина	\N	https://кино-родина.рф/	unknown	new	\N	\N	https://xn----8sblociwdfbv.xn--p1ai/images/icethumbs/212x315/100/images/Принцесса_цирка.jpg	http://localhost:9000/afisha-images/picture1.png	\N
27	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	cinema_rodina	Кинотеатр Родина	Оценка условий оказания услуг	Оценка условий оказания услуг Печать Подробности Опубликовано: 07 мая 2026 Просмотров: 84	07.05.2026	\N	Норильск	\N	\N	Кинотеатр Родина	\N	https://кино-родина.рф/	unknown	new	\N	\N	https://xn----8sblociwdfbv.xn--p1ai/images/icethumbs/212x315/100/images/Принцесса_цирка.jpg	http://localhost:9000/afisha-images/picture1.png	\N
29	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	cinema_rodina	Кинотеатр Родина	Фестиваль военного кино "Фронтовая кинопередвижка" - 2026	Фестиваль военного кино "Фронтовая кинопередвижка" - 2026 Печать Родина там, где память… В День Победы наш кинокомплекс присоединяется к общей памяти нашего народа, и по уже сложившейся традиции приглашает увидеть фестиваль военного кино «Фронтовая кинопередвижка». На протяжении трех дней норильчане и гости города смогут увидеть фильмы, проверенные временем и любовью зрителей Все показы бесплатны. Специально к празднику «Родина» открывает и инсталляцию «Улыбка вечности». Герои Великой Отечественной войны — близкие родственники сотрудников кинотеатра «Родина», - «оживлённые» на фотографии, улыбнутся нам из вечности. Всего одно мгновение, но прошедшие годы делают этот момент бесценным. #событие_в_Родине Подробности Опубликовано: 06 мая 2026 Просмотров: 83	06.05.2026	\N	Норильск	\N	\N	Кинотеатр Родина	\N	https://кино-родина.рф/	unknown	new	\N	\N	https://xn----8sblociwdfbv.xn--p1ai/images/icethumbs/212x315/100/images/Принцесса_цирка.jpg	http://localhost:9000/afisha-images/picture1.png	\N
30	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	museum_norilsk_vmuzey	Музей Норильска (ВМузей)	« Культура – моя жизненная позиция »	« Культура – моя жизненная позиция » . Выставка к 100-летию со дня рождения журналиста, почетного гражданина Норильска Гунара Кродерса	\N	\N	Норильск	\N	Ленинский проспект, 14	Музей Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
42	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	gallery_norilsk_vmuzey	Художественная галерея (ВМузей)	«Фронтовой альбом»	«Фронтовой альбом». Мультимедийная выставка из фондов Музея Победы в рамках Международного проекта « Территория Победы »	\N	\N	Норильск	\N	Талнахская, 78	Художественная галерея	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
31	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	museum_norilsk_vmuzey	Музей Норильска (ВМузей)	«Олимпийская коллекция Владимира Потанина: 80 лет хоккейной славы»	«Олимпийская коллекция Владимира Потанина: 80 лет хоккейной славы». Выставка, посвященная истории отечественного хоккея. Десятки уникальных экспонатов, по которым можно отследить всю историю выступлений сборной СССР и России на Олимпийских играх, – подлинные олимпийские медали, дипломы, факелы, элементы экипировки хоккеистов (до 15 июня)	15.06.2026	\N	Норильск	\N	Ленинский проспект, 14	Музей Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
32	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	museum_norilsk_vmuzey	Музей Норильска (ВМузей)	«ЗОЖ как ритуал и абсурд	«ЗОЖ как ритуал и абсурд. Заполярный образ жизни» . Выставка открылась в рамках Всероссийской акции «Ночь музеев – 2026»	\N	\N	Норильск	\N	Ленинский проспект, 14	Музей Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
33	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	museum_norilsk_vmuzey	Музей Норильска (ВМузей)	«Норильск на берегу моря»	«Норильск на берегу моря» . Фотовыставка в рамках Всероссийской акции «Ночь музеев» к 70-летию санатория «Заполярье»	\N	\N	Норильск	\N	Ленинский проспект, 14	Музей Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
34	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	museum_norilsk_vmuzey	Музей Норильска (ВМузей)	«Картинки из жизни норильских отдыхающих»	«Картинки из жизни норильских отдыхающих» . Выставка из фондов музея в рамках Всероссийской акции «Ночь музеев – 2026»	\N	\N	Норильск	\N	Ленинский проспект, 14	Музей Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
35	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	museum_norilsk_vmuzey	Музей Норильска (ВМузей)	«Битва за никель»	«Битва за никель» . Выставка к 81-летию Победы в ВОВ из фондов музея	\N	\N	Норильск	\N	Ленинский проспект, 14	Музей Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
36	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	museum_norilsk_vmuzey	Музей Норильска (ВМузей)	«Норильск	«Норильск. Действующие лица» . Выставка в двенадцати действиях, музейная пьеса о Норильске	\N	\N	Норильск	\N	Ленинский проспект, 14	Музей Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
37	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	museum_norilsk_vmuzey	Музей Норильска (ВМузей)	«Пересмотру не подлежит»	«Пересмотру не подлежит» . Выставка из музейного фонда истории Норильлага	\N	\N	Норильск	\N	Ленинский проспект, 14	Музей Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
38	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	museum_norilsk_vmuzey	Музей Норильска (ВМузей)	«Ненецкий словарь кочевника»	«Ненецкий словарь кочевника». VR-энциклопедия ненецкого быта и языка в форме интерактивного обучающего приложения	\N	\N	Норильск	\N	Ленинский проспект, 14	Музей Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
39	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	museum_norilsk_vmuzey	Музей Норильска (ВМузей)	«Территория»	«Территория»	\N	«Территория»	Норильск	\N	Ленинский проспект, 14	Музей Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
40	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	gallery_norilsk_vmuzey	Художественная галерея (ВМузей)	«Андрей Поздеев	«Андрей Поздеев. В поисках истины» . Выставка произведений живописи и графики Андрея Поздеева к 100-летию со дня рождения. Из художественного собрания Музея Норильска	\N	\N	Норильск	\N	Талнахская, 78	Художественная галерея	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
41	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	gallery_norilsk_vmuzey	Художественная галерея (ВМузей)	«Живая планета»	«Живая планета». Выставка произведений графики народного художника Дагестана Муртузали Магомедова к 85-летию со дня рождения	\N	\N	Норильск	\N	Талнахская, 78	Художественная галерея	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
43	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	gallery_norilsk_vmuzey	Художественная галерея (ВМузей)	«Морс в большом графине…»	«Морс в большом графине…» . Большая выставка натюрмортов – 76 произведений живописи и графики из художественного собрания Музея Норильска. Здесь же организовано пространство для создания собственных картин по мотивам тех, что представлены на выставке: приходите и садитесь за мольберт	\N	\N	Норильск	\N	Талнахская, 78	Художественная галерея	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
44	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	gallery_norilsk_vmuzey	Художественная галерея (ВМузей)	«По родной стороне»	«По родной стороне» . Выставка произведений живописи и графики Адама Адамовича Ненштиля к 100-летнему юбилею со дня рождения	\N	\N	Норильск	\N	Талнахская, 78	Художественная галерея	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
45	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	talnah_museum_vmuzey	Талнахский филиал МВК «Музей Норильска» (ВМузей)	«День Победы»	«День Победы» . Выставка из фондов Музея Победы в рамках Международного проекта « Территория Победы »	\N	\N	Талнах	\N	Енисейская, 8а	Талнахский филиал Музея Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
46	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	talnah_museum_vmuzey	Талнахский филиал МВК «Музей Норильска» (ВМузей)	«Маршрутами Урванцева»	«Маршрутами Урванцева» . Выставка-игра из фондов Музея Норильска	\N	\N	Талнах	\N	Енисейская, 8а	Талнахский филиал Музея Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
47	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	talnah_museum_vmuzey	Талнахский филиал МВК «Музей Норильска» (ВМузей)	« Северные истории »	« Северные истории » . Выставка творческих работ учащихся художественного отделения МБОУ ДО « ТДШИ »	\N	\N	Талнах	\N	Енисейская, 8а	Талнахский филиал Музея Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
48	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	talnah_museum_vmuzey	Талнахский филиал МВК «Музей Норильска» (ВМузей)	«Наследие полуострова	«Наследие полуострова. (Почти) недосягаемое» . На выставке представлены материалы экспедиций в отдаленные точки Таймыра: специалисты провели обследование, фото- и видеофиксацию, натурные исследования для дальнейшей разработки учетной документации и определения границ охраняемой территории труднодоступных объектов культурного наследия	\N	\N	Талнах	\N	Енисейская, 8а	Талнахский филиал Музея Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
49	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	talnah_museum_vmuzey	Талнахский филиал МВК «Музей Норильска» (ВМузей)	«Талнах. От первой скважины к новым горизонтам»	«Талнах. От первой скважины к новым горизонтам»	\N	\N	Талнах	\N	Енисейская, 8а	Талнахский филиал Музея Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
50	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	talnah_museum_vmuzey	Талнахский филиал МВК «Музей Норильска» (ВМузей)	«Обитатели Таймырских заповедников»	«Обитатели Таймырских заповедников»	\N	\N	Талнах	\N	Енисейская, 8а	Талнахский филиал Музея Норильска	\N	https://norilskmuseum.ru/afisha/	unknown	new	\N	\N	https://norilskmuseum.ru/wp-content/plugins/accessibility-onetap/assets/images/english.png	http://localhost:9000/afisha-images/picture1.png	\N
51	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	norilsk_art_college_vk	Норильский колледж искусств (VK)	Норильский колледж искусств 57 Оценили 57 человек 5 Показать список поделившихся Марина Калашникова Это выглядит очень странно и сюрреалистично, всё - от костюмов, до самой сцениче	Норильский колледж искусств 57 Оценили 57 человек 5 Показать список поделившихся Марина Калашникова Это выглядит очень странно и сюрреалистично, всё - от костюмов, до самой сценической стилизации. Специалисты должны получать основы от своей профессии. Дом нужно строить с фундамента. 2 Показать список оценивших 17 июн в 13:05 Поделиться Валентина Гончарова Марина , Благодарим Вас за проявленный интерес к нашей работе. Для вынесения более компетентной оценки , рекомендуем Вам подробней ознакомиться с творчеством коллектива и историей региона. Очень жаль, что костюмы не удовлетворили Ваши эстетические запросы. Нашему коллективу, напротив , очень нравится купальный наряд на главном фото Вашего профиля. Ждем Вас в гости в комментариях под нашими будущими работами 4 Показать список оценивших 19 июн в 16:23 Поделиться Написать комментарий...	\N	13:05	Норильск	\N	\N	Норильский колледж искусств	\N	https://vk.com/wall-187615124_2146?reply=2147	unknown	new	\N	\N	http://sun9-65.userapi.com/s/v1/ig2/UDAsjUYUfkuE1-h6U6Zeotn-o5Ti4R7Rfk9IQiGNa4P0YHeQ8fRe3_CNc_Jdjs-5DHtQE_cxqyNkoScFJtDVr6tH.jpg?quality=95&crop=0	http://localhost:9000/afisha-images/picture1.png	13:05
52	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	norilsk_art_college_vk	Норильский колледж искусств (VK)	Валентина Гончарова Марина , Благодарим Вас за проявленный интерес к нашей работе	Валентина Гончарова Марина , Благодарим Вас за проявленный интерес к нашей работе. Для вынесения более компетентной оценки , рекомендуем Вам подробней ознакомиться с творчеством коллектива и историей региона. Очень жаль, что костюмы не удовлетворили Ваши эстетические запросы. Нашему коллективу, напротив , очень нравится купальный наряд на главном фото Вашего профиля. Ждем Вас в гости в комментариях под нашими будущими работами 4 Показать список оценивших 19 июн в 16:23 Поделиться	\N	16:23	Норильск	\N	\N	Норильский колледж искусств	\N	https://vk.com/wall-187615124_2146?reply=2152&thread=2147	unknown	new	\N	\N	http://sun9-65.userapi.com/s/v1/ig2/UDAsjUYUfkuE1-h6U6Zeotn-o5Ti4R7Rfk9IQiGNa4P0YHeQ8fRe3_CNc_Jdjs-5DHtQE_cxqyNkoScFJtDVr6tH.jpg?quality=95&crop=0	http://localhost:9000/afisha-images/picture1.png	16:23
53	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	talnah_dshi_news	Талнахская детская школа искусств (Новости)	«Поколение будущего: Дизайн и Живопись»	В Культурно-досуговом центре им. Вл. Высоцкого открылась выставка дипломных работ выпускников художественного отделения Талнахской детской школы искусств «Поколение будущего: Дизайн и Живопись». Название выставки отражает суть представленных произведений. Это не просто демонстрация технических навыков, а смелый взгляд молодых авторов на мир, их готовность экспериментировать и предлагать свежие художественные решения. Экспозиция разделена на два ключевых направления: Станковая композиция. Этот блок представляет собой академическую школу живописи. Здесь собраны работы, демонстрирующие глубокое понимание цвета, формы и пространства. Выпускники представили сюжетные многофигурные композиции, в которых отразили своё видение окружающей действительности. Каждая работа - это законченная история, рассказанная языком искусства, где академическая выучка сочетается с индивидуальным стилем автора. Дизайн-проекты. Наиболее инновационная часть выставки посвящена благоустройству городского пространства. Юные дизайнеры представили свои разработки по улучшению городской среды Талнаха, создание малых архитектурных форм, концепции оформления общественных пространств, проекты детских площадок и арт-объектов. Эти работы отличаются функциональностью и современным подходом.	\N	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482082	unknown	new	\N	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
54	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	talnah_dshi_news	Талнахская детская школа искусств (Новости)	Успешное окончание учебного года отметили на сцене!	Юные пианисты, ученики класса преподавателя Ольги Владимировны Благовой, подвели итоги года концертом под названием «Рояль и друзья». Для родителей и гостей ребята подготовили яркую программу, в которой рояль звучал как сольно, так и в ансамблях с самыми разными инструментами. Главная идея вечера - творческая музыкальная дружба и сотрудничество с другими музыкантами. Праздничный тон был задан с первого номера: мощное звучание знаменитого произведения Г. Свиридова «Время, вперёд!» исполнил народный оркестр школы (руководитель В. А. Кузнецов, соло на рояле - О. В. Благова). С воодушевлением и большой ответственностью учащиеся представили публике пьесы Д. Кабалевского, А. Роули, П. Чайковского, И. Берлина и К. Дебюсси. В числе солистов выступили: Иван Аникин, Роберт Пономарёв, София Анганзорова, Дана Боциева, Инесса Хамуева, Екатерина Танькова, а также выпускник 8 класса Василий Горяев (балалайка). Василий обучался игре на фортепиано у Ольги Владимировны и исполнил на рояле «Прелюдию» А. Скрябина. Самая юная участница, Дарья Якубовская, и ученица 4 класса Мария Бритвина выступили с преподавателем А. З. Акмурзиным (ударные инструменты). Настоящим украшением программы стало выступление джазового трио: ученица 3 класса Виктория Зубова (рояль) вместе с Викторией Несовой (бас-гитара) и Айнуром Акмурзиным (ударные). Инструментальный дуэт в составе Карины Тер-Степанян (фортепиано) и Амины Шормаковой (домра, преподаватель С. Е. Горяева) исполнили пьесу В. Макаровой. В заключение концерта прозвучал музыкальный подарок от профессионалов - образец мастерства, к которому стоит стремиться. Ольга Благова выступила в дуэтах с преподавателями Валентином Быкадоровым (виолончель) и Владимиром Кузнецовым (баян). Музыка гениального Д. Шостаковича и ошеломляющее «Посвящение Астору Пьяцолле» В. Зубицкого стали прекрасным завершением вечера. Подготовила интересный сценарий и провела концерт музыковед Тамара Быкадорова. Уважаемые родители, спасибо за помощь и поддержку на непростом пути обучения ваших детей! Нам очень приятно и важно получать обратную связь и ваши отзывы: «Здравствуйте, Ольга Владимировна! Хочу вам сказать, что я нахожусь под таким впечатлением от концерта! Как выступление детей и педагогов показывает рост и мастерство с каждым годом занятий! С простых пьес( которые даются не легко) и до виртуозного исполнения! Столько эмоций испытала! Желаю вам творческих успехов, энергии и задора! Старательных учеников! Спасибо вам большое !» Огромная благодарность учащимся школы и преподавателям П.С. Толстокорову, В.А. Кузнецову, В.Г. Несовой, В.В. Быкадорову, А.З. Акмурзину за помощь в подготовке концертных номеров, желании поддержать творческие идеи коллег и исполнительское мастерство!!! ‍	\N	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482081	news	processed	2026-06-23 13:19:33.496774	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
64	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	talnah_dshi_news	Талнахская детская школа искусств (Новости)	Просмотр работ 7 класс	Просмотр работ за II полугодие 7 класс предпрофессиональной программы «Живопись» по предметам: Рисунок, Живопись, Композиция станковая	\N	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482043	unknown	new	\N	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
66	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	talnah_dshi_news	Талнахская детская школа искусств (Новости)	Просмотр работ 6 класс	Просмотр работ за II полугодие 6 классы предпрофессиональной программы «Живопись» по предметам: Рисунок, Живопись, Композиция станковая, Композиция прикладная, Пленэр	\N	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482041	unknown	new	\N	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
67	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	talnah_dshi_news	Талнахская детская школа искусств (Новости)	Просмотр работ 5 класс	Просмотр работ за II полугодие 5 классы предпрофессиональной программы «Живопись» по предметам: Рисунок, Живопись, Композиция станковая, Композиция прикладная, Пленэр	\N	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482039	unknown	new	\N	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
68	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	talnah_dshi_news	Талнахская детская школа искусств (Новости)	Просмотр 2, 4 класс Дизайн	Просмотр работ за II полугодие 2 и 4 класс предпрофессиональной программы «Дизайн» по предметам: Рисунок, Живопись, Графическая композиция, Основы дизайн-проектирования	\N	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482036	unknown	new	\N	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
72	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	"СЫГРАЕМ НА ПЯТЬ": ТВОРЧЕСКИЙ ДЕБЮТ НОВОГО АНСАМБЛЯ	Появление нового инструментального коллектива - настоящая тайна музыки, похожая на алхимию. Когда несколько музыкантов выступают в ансамбле ради общей идеи, то каждый инструмент — это неповторимый голос, а все вместе они создают уникальный диалог разных характеров и настроений. Часто этот творческий процесс называют "сыгранностью", в которой важен исполнительский вклад каждого участника ансамбля. В этом году на духовом отделении школы искусств возник инструментальный коллектив в новом формате - КВИНТЕТ КЛАРНЕТИСТОВ . Данная творческая инициатива объединила преподавателей отделения "Духовые инструменты" Владислава и Евгения Самарцевых и учащихся выпускного класса Дмитришина Валерия, Четвергова Ярослава, Шевченко Владислава. В репертуаре квинтета кларнетистов - современные композиции Х. Переса, Дж. Вильямса, П. Жан-Жана. Оценить оригинальность репертуара и тембрового звучания ансамбля смогут слушатели концерта духового оркестра "Отзвуки марша и танца" , который состоится в Концертом зале школы искусств уже в эту пятницу, 10 апреля. Приглашаем на концерт всех желающих!	10.04.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2443535	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
76	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	НОВЫЕ ИМЕНА В НОРИЛЬСКЕ!	С 15 по 17 апреля у юных норильских музыкантов и художников вновь появится возможность стать стипендиатами Благотворительного фонда «Новые имена» им. Иветты Вороновой. К слову, конкурс проводится уже в пятый раз, и в прошлом году норильские таланты побили собственный рекорд – сразу пять полученных стипендий! Программа конкурса начнётся 15 апреля в 19:00 с концерта-открытия в Городском концертном зале (ул. Богдана Хмельницкого, д. 17а). Для зрителей сыграют педагоги муниципальных образовательных учреждений и приглашённые эксперты фонда «Новые имена». Гостями города станут: Наталья Андреевна Шохирева – преподаватель Академического музыкального училища при Московской государственной консерватории им. П. И. Чайковского, кандидат искусствоведения; Иван Иванович Малоштанов – заслуженный артист РФ, преподаватель кафедры медных духовых и ударных инструментов, духового ансамбля и оркестра Центральной музыкальной школы — Академии исполнительского искусства; Елена Ивановна Забавская – доцент Российской академии музыки им. Гнесиных; Алексей Сергеевич Шипунов – эксперт Благотворительного фонда «Новые имена», лауреат международных конкурсов; Варвара Андреевна Лотова – член Российского союза художников, преподаватель Московского государственного академического художественного института им. В. И. Сурикова и Колледжа музыкально-театрального искусства имени Г. П. Вишневской. 16 апреля эксперты Фонда проведут для участников мастер-классы по игре на музыкальных инструментах и изобразительному искусству, а уже на следующий день, 17 апреля, состоится главный этап конкурса – прослушивание музыкантов и просмотр работ художников. Итоги объявят в этот же день в 19:00 на концерте-закрытии. Сохраняйте афишу и приходите поддерживать конкурсантов и наслаждаться музыкой! ВХОД СВОБОДНЫЙ!	17.04.2026	19:00	Норильск	0	ул. Богдана Хмельницкого, д	Норильская детская школа искусств	\N	https://nordshi.ru/item/2196636	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	19:00
77	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	КОНЦЕРТЫ АПРЕЛЯ	Дорогие друзья! Мы будем рады видеть вас на наших концертах, которые пройдут 8, 10 и 11 апреля! Чтобы не пропустить важные события школы, вы можете перейти на наш сайт в группе ВКонтакте Норильская детская школа искусств/НДШИ Ждем вас!	11.04.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2190813	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
78	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	ДЛЯ САМЫХ МАЛЕНЬКИХ	В первый день календарной весны мы приглашаем юных норильчан и их родителей всей семьёй совершить "Волшебное путешествие в мир музыки". Концертная программа представит яркую и разнообразную палитру музыкальных инструментов, порадует выступлением учащихся школы искусств и зарядит всех слушателей надолго хорошим настроением! До встречи 1 марта в 14 часов в Концертном зале школы искусств! Вход свободный. #НорильскаяДетскаяШколаИскусств #культураКрасноярья #КрайВысокойКультуры2 .0	01.03.2026	\N	Норильск	0	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2139101	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
5	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	gck	Городской центр культуры	22 июня 1941 года	Сегодня, 22 июня, ранним утром на площади Памяти Героев у Вечного огня состоялось памятное мероприятие, посвящённое 85-й годовщине начала Великой Отечественной войны. Именно в 8:00 часов по норильскому времени началось вторжение гитлеровской Германии в Советский союз, перечеркнувшее планы на светлое будущее и судьбы миллионов людей. Впереди были 1418 дней и ночей страданий, боли, потерь и войны. Представители Администрации города Норильска, депутаты Норильского городского Совета депутатов, сотрудники органов внутренних дел и силовых структур, участники движения «Юнармия», работники подведомственных учреждений и жители города — вместе вспомнили подвиг советского народа и почтили минутой молчания и оружейным залпом память тех, кто ценой жизни защитил наше Отечество. Перед Вечным огнём были выстроены из горящих свечей слова «Норильск помнит» и почётный знак «Город трудовой доблести». Гости церемонии так же зажгли и возложили свечи памяти и цветы. Памятное мероприятие прошло в рамках всероссийских акций «Свеча памяти», которая проходит по всей стране с 2009 года, и «Огненные картины войны». По традиции, в этот день каждый желающий может зажечь свою свечу памяти — дома или в организации — как символ скорби и вечной памяти о 27 миллионах соотечественников, погибших в годы Великой Отечественной войны. В 12:15 по московскому времени по всей стране прошла масштабная акция, посвящённая памяти жертв Великой Отечественной войны, – Всероссийская акция «Минута молчания». Выбор времени проведения акции неслучаен – именно в этот день в 12 часов 15 минут в 1941 году в эфире вышло обращение правительства к гражданам Советского Союза о нападении нацистской Германии. На одну минуту жизнь в стране замерла прекратили работу кассы в торговых центрах, остановился общественный транспорт и личные автомобили, на предприятиях, где позволяет технологический процесс, приостановилось работа. Вечная память Героям, вечная слава защитникам Родины!	22.06.2026	08:00	Норильск	\N	\N	Городской центр культуры	\N	http://www.gcknorilsk.ru/22-iyunya-1941-goda/	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/9d2d7116f688b08f209a84dbd763647995e099e8c49776c627f4bd4e9f235db0.jpg	http://localhost:9000/afisha-images/picture1.png	08:00
81	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	ДУША И СИЛА СИБИРИ	30 ноября в 17 часов в Концертном зале школы искусств состоится концерт «Душа и сила Сибири», посвященный 90-летию образования Красноярского края . В масштабном мероприятии в честь памятной даты примут участие творческие коллективы учащихся школы : -Образцовый хореографический ансамбль «Созвездие»; -Хор младших классов; -Хор старших классов; -Три фольклорных ансамбля: «Кудесники», «Карусель», «Соловушки»; -Оркестр русских народных инструментов. В концерте выступят также педагогические творческие силы разных поколений в составе вокального ансамбля и фортепианного квартета. В качестве солистов на сцену выйдут молодые преподаватели школы, успешно сочетающие педагогическую деятельность с исполнительской: Анна Шунц (фольклорное искусство) и Владислав Самарцев (кларнет). Вход свободный. Тел. для справок: 8-913-161-06-26	30.11.2026	\N	Норильск	0	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2056544	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
89	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	МУЗЫКАЛЬНОЕ ПРИВЕТСТВИЕ	Дорогие друзья! Уже в эту субботу в 15 часов состоится "День открытых дверей". Откройте детям мир музыки и танца! А мы поможем вам сделать свой выбор!	18.04.2024 08:00	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/1861368	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
84	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	ЧТОБЫ ПОМНИЛИ	Всё можно сокрушить, Предать забвенью, Заасфальтировать бетон, Взорвать собор, как лишнее строение, На месте кладбища построить стадион. Всё можно растерять, что собрано веками, Заставить замолчать, расправами грозя, Но только человеческую память, Не заблокировать, и истребить нельзя. Дорогие друзья! 26 октября в 17 часов мы ждем вас в Концертном зале школы на музыкальном вечере "Чтобы помнили" , который посвящён Дню памяти жертв политических репрессий. Пусть струна памяти об этом тяжелом прошлом в истории нашего города и страны звучит в душе каждого из нас! Напомним об этом следующим поколениям, и чтобы те далекие и страшные события никогда не повторились вновь. Вход свободный.	26.10.2026	\N	Норильск	0	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2024668	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
86	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	ПОСЛЕДНИЙ ПОКАЗ	Уже сегодня 3 мая в 19ч состоится последний показ оперы-мюзикл "Разыскивается принцесса". Ждём всех желающих! Вход свободный! При поддержке Президентского фонда культурных инициатив	03.05.2026	\N	Норильск	0	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/1874742	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
87	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	ПОБЕДНАЯ ВЕСНА	Дорогие друзья! Приближается самый главный праздник весны - день Великой Победы! Это праздник нашей гордости и славы, огромной радости со слезами на глазах. Приглашаем вас на традиционный для школы искусств концерт, посвящённый 9 мая! Давайте все вместе вспомним о той войне и о ее героях, чей незабвенный подвиг навсегда сделал нас наследниками Победы. Мы ждем вас 4 мая в 17ч Концертном зале школы искусств. Вход свободный.	09.05.2026	\N	Норильск	0	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/1871566	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
92	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	"НЕУГАСИМА ПАМЯТЬ ПОКОЛЕНИЙ И ПОДВИГ ТЕХ, КОГО ТАК СВЯТО ЧТИМ!"	2 мая , в преддверии великого Дня Победы , наш праздничный концерт стал особенным событием, по традиции объединяющим в зале разные поколения горожан. Ежегодно этот мост между поколениями строят коллективы учащихся и преданные своему делу преподаватели школы искусств. Они создают неповторимую атмосферу мощного эмоционального подъёма, которой проникаются зрители, сидящие в зале. Словом, музыкой, пением, эстетикой видеооформления мы наполняем сердце каждого симфонией чувств - великой радостью, неподдельной гордостью и духовным единением, которое в наши дни так важно для каждого. С наступающим Днем Великой Победы норильчан поздравили : сводный хор (рук. В. Плужник, Ф. Зейналова) при участии солистов: А. Бигус (НКИ), А. Жданова, Р. Шайхисламова; Образцовый хореографический ансамбль "Созвездие" (рук. А. Соколова); духовой оркестр (рук. М. Захарьяш) при участии преподавателей ТДШИ И НКИ; фольклорный ансамбль "Куролесы" (рук. А. Шунц) при участии Е. Иванова (ОДШИ), А. Кузнецовой, А. Остапченко (гитара); фортепианный квартет (рук. О. Соколова); инструментальное трио: Г. Кутушева, Е. Елфимова, Е. Беляева; Е. Чернышева (домра), конц. Д. Мусина (преп. Афендикова Л.В.). Песня-гимн Д. Тухманова "День Победы" стала мощной вокально-инструментальной кульминацией финала концерта. Этот музыкальный символ Победы зрители в зале пели, стоя, эмоциональный накал достиг своей вершины. Песня стала мостом между прошлым и настоящим, напоминая о великом подвиге и о дорогой цене мира. Разделяем со зрителями все эмоции неповторимого концерта! Пусть благодарная память о подвиге наших солдат сохранится не только в наших сердцах и семейных историях, но и передается будущим поколениям!	02.05.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2462916	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
94	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	ВМЕСТЕ ПРОТИВ КОРРУПЦИИ	Генеральной прокуратурой РФ организовано проведение Международного молодежного конкурса социальной антикоррупционной рекламы "Вместе против коррупции". Конкурсные работы принимаются на сайте www.anticorruption.life с 1 мая по 1 октября 2026 года. Три номинации: - "Лучший плакат" - "Лучший рисунок" - "Лучший видеоролик" Возрастные группы от 10 до 17 лет; от 18 до 25 лет.	01.05.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2462676	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
96	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	ОТ ПЕРВЫХ НОТ К ПЕРВЫМ АПЛОДИСМЕНТАМ	Чему можно научить ребёнка за 8 месяцев занятий в музыкальной подготовительной группе? Вы удивитесь - очень многому! 27 апреля учащиеся отделения раннего эстетического развития школы искусств выступили в уроке-концерте под руководством преподавателя Евгении Сидоровой. Будущие первоклассники школы искусств продемонстрировали родителям свои умения и навыки в непринуждённой атмосфере, где главную роль играют игра и творчество. Наши малыши: знают музыкальную грамоту; играют ритмические партии в шумовом оркестре; уверенно интонируют и поют; различают на слух высоту звуков, тембры и темпы; развивают координацию своих движений; выступили на малой сцене с искренней эмоциональной отдачей, удовольствием и артистизмом. Все это станет отличной основой для дальнейшего обучения на выбранном инструменте! Начало положено!	27.04.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2461055	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
98	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	КЛАВИШИ ВДОХНОВЕНИЯ	Играть на фортепиано любят или мечтают об этом все! Выразительные возможности и богатый классический репертуар для этого инструмента каждый год делают его безусловным фаворитом среди детей, молодёжи и родителей. Концерт воспитанников фортепианного отделения "От классики до современности" стал творческим итогом огромной совместной работы педагогов и учащихся. В нем выступили солисты и ансамбли фортепианного отделения, объединив юных пианистов от первого до выпускного классов. Такие концерты очень важны для участников: каждый из них учится чувствовать музыку и делиться своими эмоциями со слушателями. Особое внимание и отклик у зрителей вызвали ансамбли и фортепианные дуэты, в том числе "учитель - ученик". Это всегда - диалог на равных, когда педагог передает опыт через совместное музыкальное творчество. В концерте выступили учащиеся преподавателей отделения Афендиковой Л.В., Самарцевой М. В., Волковой Е.В., Деминой Е.В., Макаренко Г.А., Соколовой О.Е., Остапченко Д.Е., Елизаровой Ю.В., Струкова Н.П. Благодарим зрителей за поддержку и аплодисменты, которые вдохновляют юных пианистов на новые успехи!	23.04.2026 10:14	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2455914	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
99	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	МУЗЫКА В ЛАДОШКАХ	Отделение раннего эстетического развития школы искусств — это творческая среда, где раскрываются юные таланты и закладывается музыкальный фундамент для дальнейшего обучения. 21 апреля 11 самых маленьких учащихся школы выступили как настоящие артисты в музыкальной сказке "Колобок" . Автором музыкальных партий и текстов сказки стала преподаватель отделения Замира Шагиева. Ребята продемонстрировали родителям всё, чему научились за это время: от пения (сольно и в хоре) и игры на музыкальных инструментах до умения держаться перед публикой. Музыкальный дебют удался каждому юному артисту! Каждого из них мы будем рады приветствовать осенью в числе первоклассников!	21.04.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2454936	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
107	2026-06-23 13:17:55.030033	2026-06-23 13:17:55.030033	\N	nordshi_afisha	Норильская детская школа искусств (Афиша)	ЭКВАТОР ПРОЙДЕН	Дневник второго дня Межмуниципального конкурса по музыкально-теоретическим дисциплинам "Надежда Норильска" - об испытаниях по сольфеджио и музыкальной литературе. В конкурсе по сольфеджио приняли участие обучающихся 4-х, 7-х и 8-х классов образовательных учреждений культуры Норильска и Дудинки. С волнением, но с большим старанием они выполняли задания на развитие музыкального слуха, мышления и памяти. В мире музыкальной литературы конкурсантам предоставилась возможность не только проявить свои знания, но и умение мыслить творчески: в викторине и письменной работе; в защите проектов по творчеству С. С. Прокофьева. Следите за обновлениями, чтобы узнать имена лауреатов и дипломантов конкурса 2026 года!	23.03.2026 10:28	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2431979	unknown	new	\N	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
3	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	northdrama	Заполярный театр драмы	Экскурсия «Закулисье»	Описание Галерея Рецензии Билеты Экскурсия «Закулисье» интерактивный спектакль Экскурсия «Закулисье» интерактивный спектакль Как устроен самый северный театр? Что такое реквизит? Сколько людей трудится над созданием одной постановки? Что находится под сценой театра? Сколько этажей в здании? Об этом вам расскажут артисты театра, приоткрыв завесу тайны. Маршрут будет лежать через основную сцену и ее закулисье: вы узнаете о техническом оснащении сцены, увидите «святую святых» – актерские гримерки с теми самыми столиками с лампочками, как в кино. Вы побываете в пошивочном, бутафорском и декорационном цехах. После такой экскурсии просмотр спектаклей заиграет новыми красками! Для групп от 15 человек возможна организация индивидуального посещения (требуется предварительная запись по телефону администратора). Подробнее о проведении и условиях можно узнать по телефонам: Администратор – +7 (3919) 22-70-43 Билетная касса – +7 (3919) 22-68-69 Купить билет Купить билет Сцена Малая сцена Время 1 час Галерея Все фотографии Отзывы Экскурсия очень понравилась! Давно хотелось побывать на "другой стороне". Сколько труда, людей задействовано в подготовке постановок кроме артистов! Столько оборудования, реквизита, и всё должно работать. Провел экскурсию Владислав Молдованов, он просто умница! Спасибо ему большое! Хочется выразить благодарность всем работникам нашего замечательного театра за возможность побывать по другую сторону зрительного зала! Юлия 05.05.2026 Билеты 24 июня среда Экскурсия «Закулисье» интерактивный спектакль 15:00 Купить билет Частые вопросы У меня возникли проблемы при покупке электронного билета, что делать? При возникновении вопросов и затруднений в процессе покупки электронных билетов (если вам не пришло электронное письмо с файлом билета или вы его потеряли/случайно удалили) для оперативного их решения обращайтесь в службу поддержки билетного оператора ИНТИКЕТС ( +7 (495) 225-54-22 ) Нужно ли распечатывать электронный билет? Для посещения мероприятия необходимо предъявить электронный билет либо в виде распеченного бланка либо в виде PDF-документа с читаемым штрихкодом/QR-кодом на экране мобильного устройства. Исключением является время отсутствия интернета, когда контролеры не могут считать ваш QR-код сканером. В этом случае Вас попросят распечатать билет в кассе театра. Как вернуть или обменять билеты? Возврат билетов по инициативе зрителя возможен по заявлению зрителя в соответствии с Федеральным законом № 193-ФЗ от 18.07.2019 г. При этом возвращается: • не позднее 10 дней до мероприятия — 100% от стоимости; • менее 10 дней, но не позднее 5 дней до дня мероприятия — 50% от стоимости; • менее 5 дней, но не позднее 3 дней до дня мероприятия — 30% от стоимости; • менее 3 дней до дня мероприятия возврат не осуществляется. Возврат билетов происходит по месту приобретения. Чтобы оформить возврат через кассу театра, вам необходимо предоставить заявление о возврате , оригинал неиспользованного билета, кассовый чек, а также сопутствующие документы при необходимости. Срок принятия решения о возврате не превышает 10-ти дней со дня приема заявления. В случае положительного решения Театр осуществляет возврат денежных средств не позднее 10-ти дней со дня принятия решения. Для возврата электронных билетов, приобретенных на официальном сайте Театра, необходимо воспользоваться сервисом возврата билетов . В случае приобретения электронных билетов, а также билетов с использованием банковских карт на сайте и в кассе театра, срок возврата денежных средств за такие билеты может быть увеличен до 45 дней. Если мероприятие отменено по инициативе Театра, то возврат билета осуществляется по полной стоимости. Для решения вопроса в частном порядке можно связаться с администратором. С более подробной информацией о порядке возврата билетов вы можете ознакомиться прочитав «Правила продажи театральных билетов». Нужен ли билет ребёнку, и с какого возраста? Для посещения спектаклей ребенку до 3-х лет билет не нужен, так как он занимает одно место с сопровождающим. По достижению 3-х летнего возраста билет полагается и ребенку и сопровождающему. Как купить билет по Пушкинской карте? Приобрести билет по Пушкинской карте можно на сайте Театра. При оплате необходимо указать «Пушкинской картой». Рекомендуем к проСмотру Экскурсия «История театра» интерактивный спектакль	24.06.2026	1 час	Норильск	\N	\N	Заполярный театр драмы	\N	https://www.northdrama.ru/repertuar/ekskursiya-zakulise	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/9c920d436df5ebb9f101fcd3717002774700c7bb9547bcf0a903adb13a49ee84.png	http://localhost:9000/afisha-images/events/detail/4e879190c9e41bfa1ebcac7f24ec6adb4e5ffba8b8ffb2c0d2188a841c2e197c.jpg	15:00
4	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	northdrama	Заполярный театр драмы	Капитанская дочка	Сезон закроется премьерой спектакля «Капитанская дочка» по одноименному роману А.С. Пушкина и драматической поэме С.А. Есенина . Спектакль тематически, содержательно, идейно поддержит линию «Княжны Таракановой…» в нашем репертуаре: он о Русском бунте — «бессмысленном и беспощадном», и о большой любви, которая «сильнее смерти». Он о нашей истории, проходящей по судьбам людей порой огромным пыточным колесом и оставляющей глубокие незаживающие шрамы в сердцах и памяти. Он о трагическом нравственном выборе между долгом и личным чувством. О чести и подлости, о верности и предательстве. Об очистительной силе Добра и Благодарности в помыслах и поступках человеческих. «История народа принадлежит поэту» — эта пушкинская формула из письма Н.И. Гнедичу, обозначает его творческое кредо в осмыслении, интерпретации событий прошлого. По Пушкину, именно Поэт-Пророк может интуитивно понять, почувствовать, провидеть — «куда влечет нас рок событий» , бесхитростно оценить историческую роль/перспективу того или иного персонажа общественной жизни. Литературная фантазия авторов будущего спектакля сулит нам встречу сразу двух известнейших русских Поэтов, разных эпох и стилистических пристрастий, — в оценке одного исторического/культурного персонажа: Емельяна Пугачева, предводителя Крестьянской войны второй половины XVIII века, человека неординарного, даже таинственного, жизнь и смерть которого притягивали внимание многих на протяжении веков. Ему посвящены монография «История Пугачевского бунта» (1834) и роман «Капитанская дочка» (1836) А.С. Пушкина, драматическая поэма «Пугачев» С.А. Есенина (1921), о нем так остро и проникновенно написала Марина Цветаева: «В «Капитанской дочке» Пушкин под чару Пугачева подпал и до последней строки из-под нее не вышел… Чара дана и пронесена сквозь все встречи, — с Вожатым, с Самозванцем — на крыльце, с Самозванцем пирующим, с Пугачевым — сказывающим сказку, с Пугачевым карающим, с Пугачевым прощающим, с Пугачевым — в последний раз кивающим… с плахи… В самозванце-Емельяне Пушкин отвел душу от самодержца-Николая, не сумевшего его ни обнять, ни отпустить…» И понятно, почему так притягательны для Поэта эти черные глаза, ласковая, но зловещая улыбка: Все, все, что гибелью грозит, Для сердца смертного таит Неизъяснимы наслажденья – Бессмертья, может быть, залог… Впрочем, Пушкин-прозаик все-таки реалист: он видит обреченность крестьянского бунта и его лидера, указывает на авантюрность, жестокость всех планов, деяний Пугачева… И тем именно заслуживает упрек/возражение поэта Есенина, предположившего, что взгляд дворянина на крестьянского царя все же не проникает вглубь явления, что автор «Капитанской дочки» слишком сосредоточен на усмирителях восстания и его жертвах, а приглядеться/прислушаться следует к восставшим – они крупные яркие герои, среди них Пугачев — настоящий романтический персонаж, вообще «почти гениальный человек», так что и революция 1917 года, и крестьянские волнения 20-х годов ХХ века – это «второе пришествие Пугача». В нашем будущем спектакле эти две стороны социального противостояния – дворяне и крестьяне – по-настоящему заговорят «на разных языках». Дворянам будут отданы слова А.С. Пушкина-реалиста, взятые из романа и значимых для постановки стихотворений (причем, воспоминания постаревшего П.А. Гринева о мятежной юности зазвучат в исполнении… Народного артиста СССР И.М. Смоктуновского). А мужицкая стихия взметнется стихами С.А. Есенина-имажиниста, ярко эмоциональными, насыщенными сложнейшими метафорами, необычными инверсиями. Таким образом в ткань спектакля войдет история восстания и «воцарения» Пугачева, которой фактически нет в романе «Капитанская дочка». Легкая поступь пушкинской лиры, преисполненной, впрочем, ощущением трагичности бытия, — и разбойная удаль есенинских строк, где в каждом слове автор ощущал «кровь и мясо»: «вдавив в землю ступни и пятки, крепко стоит мой стих». Такова сложнейшая партитура ожидающего нас «состязания поэтов»… Впрочем, не забудем и про дочь капитана Миронова – ту образно-сюжетную линию, которую Пушкин так мучительно искал, а Есенин так неистово отрицал («В моей трагедии вообще нет ни одной бабы… Они тут совсем не нужны: пугачевщина – не бабий бунт»). Пусть спорщиков примирит перспектива: грандиозная трагедия пугачевщины – зловещая черная дыра на ткани жизни. А чистые, ясные, бесхитростные души незаметных героев и героинь, таких, как Миронов, его жена и дочь, — благая весть для тех, кто все же верит в живительную силу Добра. Таким был Пушкин. К этому пробивался сквозь тьму тяжелых мыслей Есенин. Да и Пугачеву, нет-нет, а нестерпимо требовалось порой согреться теплом «заячьего тулупчика» с чужого плеча;))) До встречи на премьере! Все Описание	27.06.2026	\N	Норильск	\N	\N	Заполярный театр драмы	12+	https://www.northdrama.ru/repertuar/kapitanskaya-dochka-spektakl-po-odnoimennomu-romanu-a-s-pushkina-i-dramaticheskoj-poeme-s-a-esenina-pugachev	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/a6cbd78d4339fbb6e5b55b0c18bfed8ad95838aaf2a4585267dd1c453db71ea6.jpg	http://localhost:9000/afisha-images/picture1.png	18:00
6	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	gck	Городской центр культуры	Как двигался север	14 июня в Выставочном зале Городского центра культуры состоялся яркий вечер «Движение Севера», посвященный косплею и необычным хобби. Жаркая погода и газ не помешали всем пришедшим как следует повеселиться. По сцене прошлись персонажи из книг, кинофраншиз и аниме. Ведущие провели веселые розыгрыши, в ходе которых зрители поучаствовали в импровизированном показе мод и даже в дуэли. Победители ушли со сцены с подарочными пакетами от организаторов, а те, кому не досталось приза, получили свой шанс, поучаствовав в маленькой лотерее для всех участников. Много живого общения, улыбок и хорошего настроения — всё это создало дружескую атмосферу, где каждый смог поучаствовать в жарком обсуждении любимого тайтла. Так же всех порадовала уютная Аллея Авторов, где авторы Норильска представили свои товары: украшения, десерты и игрушки. А для тех, кому нужно было срочно разрешить какой-то спор, был организован уголок с консолями для мощных сражений в «Tekken 8». Это было камерное и приятное событие, которое обязательно повторится в следующем году. А пока есть время для подготовки к фестивалю «АРКТИКОН»! Увидимся в октябре! Больше фото смотрите в нашем альбоме .	14.06.2026	\N	Норильск	\N	\N	Городской центр культуры	\N	http://www.gcknorilsk.ru/kak-dvigalsya-sever/	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/3553b89a10ac228ef1751ff07c48438e1b2f8d734500289b5bf82c04886efc95.jpg	http://localhost:9000/afisha-images/picture1.png	\N
8	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	gck	Городской центр культуры	Аншлаг на «Движение севера»	Уважаемые жители и гости Норильска! К сожалению, билеты на необычный квартирник «Движение севера» 14 июня в 18:00 в Городском центре культуры закончились! Аншлаг.	14.06.2026	18:00	Норильск	\N	\N	Городской центр культуры	\N	http://www.gcknorilsk.ru/anshlag-na-dvizhenie-severa/	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/8d6d40169ab9e08fd7e2dc768be50a8aa4ea938424913fce02f0a5feab268450.jpg	http://localhost:9000/afisha-images/picture1.png	18:00
9	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	gck	Городской центр культуры	Акция «Пушкинские выходные»: вместе и с выгодой!	Городской центр культуры присоединяется к краевой акции «Пушкинские выходные» для владельцев «Пушкинской карты». При покупке билета на мероприятие, которое будет проходить в субботу или воскресенье, или в дни государственных праздников и школьных каникул, вы получаете возможность приобрести дополнительный билет на это же мероприятие со скидкой 25% для ваших родителей! Следите за анонсами наших мероприятий! Важные условия участия в акции: владелец «Пушкинской карты» обязан предъявить свой паспорт; родители должны предоставить документ, удостоверяющий личность; иметь при себе документ, подтверждающий родство с ребёнком. Как принять участие в акции: приобретите билет по «Пушкинской карте»; забронируйте билеты для родителей одним из способов: позвоните в кассу по телефону 22-99-14 или посетите кассу лично; получите скидку 25% на билеты для родителей при выкупе билета в кассе. Скидка для родителей работает только тогда, когда вы идёте вместе! Все подробности – в положении . До встречи в Городском центре культуры! #Пушкинскаякарта #Пушкинскиевыходные	11.06.2026	\N	Норильск	\N	\N	Городской центр культуры	\N	http://www.gcknorilsk.ru/akciya-pushkinskie-vyxodnye-vmeste-i-s-vygodoj/	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/847c581fe713356cf16d9d0f546fddbd7eba7f7f0acb7b506d28391940404650.jpg	http://localhost:9000/afisha-images/picture1.png	\N
10	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	gck	Городской центр культуры	Наш дом — Россия!	12 июня – День России, День рождения нашей страны. Это особенный праздник, который объединяет все города и регионы нашей любимой Родины. 2026 год объявлен Президентом РФ Владимиром Владимировичем Путиным Годом единства народов России, а значит и мероприятия, посвящённые главному празднику российской государственности, предстоят масштабные. В 11:00, впервые в День России, на главной площади города развернётся настоящий гастрономический фестиваль. Угощения русской и других национальных кухонь будут радовать гостей праздника до самого вечера. В 13:00 пройдет торжественное открытие 56 сезона трудовых отрядов школьников. В 13:30 на площади Комсомольской начнётся праздничная программа «Наш дом – Россия!», и весь Норильск вместе с представителями национально-культурных объединений города исполнит Государственный гимн Российской Федерации. В это же время, впервые в День России на площади Гвардейской пройдут открытые спортивные турниры и соревнования для всех желающих от Управления по спорту Администрации города Норильска. Гостей и жителей Большого Норильска ждут следующие площадки: Стритбол; Футбол; Армрестлинг; Дартс; Силовой экстрим; Площадка ГТО; Шашки настольные; Дорожный патруль (электромобили). И конечно любимые гигантские игры для всех возрастов – дженга, боулинг, шашки и городки. Праздничный концерт на площади Комсомольской продлится до 19:00. С Днём России Норильск поздравят участники фестиваля «Край наш общий дом», а также хореографические и вокальные коллективы «Оганер», «Шкода», «Фристайл», «Болеро», «Voices» и «Вдохновение». Каждые 30 минут будут проходить конкурсно-развлекательные программы и розыгрыш ценных призов от Группы компаний «Жар. Птица». Для юных норильчан на площади будут проходить разные активности от аквагрима и «робосумо» до «палитры талантов» и «ЭКОквиза»! Приобрести праздничную атрибутику, сувениры, напитки и сладости можно будет в торговых точках, установленных здесь же. С 16:20 до 17:00 на праздничной сцене впервые пройдёт яркая и зажигательная танцевальная битва между лучшими танцорами и хореографическими коллективами города. А в 17:00 состоится розыгрыш целого миллиона в честь дня рождения Группы компаний «Жар. Птица». Завершит концертную программу «Наш дом – Россия!» выступление лучшего кавер-бенда Арктики «Red_O». Будем танцевать вместе со всей страной, отметим День России всем Норильском!	12.06.2026	11:00	Норильск	\N	\N	Городской центр культуры	\N	http://www.gcknorilsk.ru/nash-dom-rossiya/	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/db0cd75a37772933b78ce804b5f5f553dba42e5115d09e420cd1d3b9bbea6b1b.jpg	http://localhost:9000/afisha-images/picture1.png	11:00
12	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	gck	Городской центр культуры	Поздравляем всех с Днём русского языка!	Праздник официально появился в России в 2011 году, а дата выбрана не случайно – 6 июня родился поэт, чьи произведения знают далеко за пределами страны и переводят на десятки языков мира. Даже если вы давно не открывали томик классики, с Пушкиным вы всё равно встречаетесь почти каждый день – в цитатах, мемах, экранизациях, спектаклях и в нашей программе «Пушкинская карта». Именно Пушкина называют создателем современного русского литературного языка, на котором мы сегодня шутим, пишем, признаёмся в любви и спорим. Так что сегодня – отличный повод перечитать любимые строки, посмотреть пару фильмов про гения, или послушать стихи, которые прочли для вас в разных учреждениях культуры края. Переходи по хэштегу #ЧитаемПушкинаНаЕнисее! #ПушкинскийДень2026 #ПушкинскаяКарта24 #6ИюняКрасноярскийКрай	06.06.2026	\N	Норильск	\N	\N	Городской центр культуры	\N	http://www.gcknorilsk.ru/pozdravlyaem-vsex-s-dnyom-russkogo-yazyka/	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/267a12072c2cc8cb2460d7642058f1735bb50d65bef1662fda092547b0f4d45a.jpg	http://localhost:9000/afisha-images/picture1.png	\N
14	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	gck	Городской центр культуры	Посещение мероприятий семьями мобилизованных граждан, июнь 2026	Семьи лиц, участвующих в специальной военной операции, могут бесплатно посетить мероприятия и клубно-досуговые формирования Городского центра культуры. С Порядком бесплатного посещения семьями лиц, принимающих участие в специальной военной операции, культурных мероприятий всех форм, клубных формирований и кинопоказов, организуемых МБУК «Городской центр культуры» можно ознакомиться в подразделе «Услуги» раздела «О нас» нашего сайта или пройдя по ссылке . К членам семьи участников специальной военной операции относятся: • супруг/супруга; • несовершеннолетние дети и дети в возрасте до 23 лет, обучающиеся в образовательной организации по очной форме; • лицо, сопровождающее несовершеннолетних дети мобилизованного гражданина; • родители, совместно проживающие с участниками специальной военной операции. КАЛЕНДАРНЫЙ ПЛАН МЕРОПРИЯТИЙ МБУК «ГОРОДСКОЙ ЦЕНТР КУЛЬТУРЫ» НА ИЮНЬ 2026 ГОДА для посещения членами семей участников СВО на безвозмездной основе Дата Время начала Название мероприятия 14.06.2026 18:00 Творческий вечер косплееров «Движение севера» ПЕРЕЧЕНЬ КЛУБНЫХ ФОРМИРОВАНИЙ МБУК «ГОРОДСКОЙ ЦЕНТР КУЛЬТУРЫ» НА ИЮНЬ 2026 ГОДА для посещения членами семей участников СВО Название коллектива Возрастной рейтинг Свободные места Норильский хор «Вдохновение» 18+ 10 Театральная студия «ДА» 10-18 5 Городская академическая хоровая капелла 16+ 5 Народная самодеятельная студия Клуб флористов-дизайнеров «Галакс» 18+ 5 Клуб интеллектуальных игр «Что? Где? Когда?» 12-18 10 Норильская лига юмора 14+ 10 Танцевальный клуб «Вива» («Золотой возраст») 50+ 10 Творческая ассоциация норильских авторов и исполнителей (Клуб авторской песни) 16+ 10 Творческое объединение «Планёрка» 18+ 10 Творческое объединение «Атмосфера» 14+ 10 Творческое объединение «Киви» 14+ 10 Творческое объединение «Без границ» 14+ 5 Контакты для справочной информации и подачи заявок: Тел.: 8(3919)22-60-39, информационно-методический отдел Тел.: 8(3919)22-99-14, касса e-mail.: gck.kassa@mail.ru	14.06.2026	18:00	Норильск	\N	\N	Городской центр культуры	18+	http://www.gcknorilsk.ru/poseshhenie-meropriyatij-semyami-mobilizovannyx-grazhdan-iyun-2026/	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/4a86b7fbb7bdcd1a3a803f6e639cb1c1d0827c9fba96478edb8e1f855944d59b.jpg	http://localhost:9000/afisha-images/picture1.png	18:00
16	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	norilsk_official	Официальный сайт города Норильска	Вдохновленные Арктикой	Афиша мероприятий Музей Норильска вместе с другими музеями Красноярского края и шестью приглашенными художниками участвует в большом выставочном проекте «Идея Севера» . Выставка работает на крупнейшей в Сибири выставочной площадке современного искусства – в Музейном центре «Площадь Мира» (г. Красноярск) и занимает сразу два этажа. Арктика сейчас – территория стратегического внимания. Новый документально-художественный проект – многослойное высказывание о феномене Севера через современную музейную архитектуру, художественные инсталляции и музейные артефакты. Это пространственно-средовой рассказ об истории освоения экстремальных широт, ледоколах и подвигах, о жизни человека в условиях бескрайнего снега, льда и полярной ночи, о богатых ресурсах ещё недавно совсем не исследованной земли. Для выставки Музей Норильска отобрал более 300 снимков из фотофонда, образцы горных пород Таймыра из геолого-минералогической коллекции и шесть уникальных ровдужных картин Бориса Молчанова, выдающегося долганского художника, который еще при жизни стал известен на весь мир – именно картинами из ровдуги (оленьей замши), которые не имеют аналогов в мировом искусстве. Частью коллективной экспозиции стал и авторский фотопроект резидента Полярной арт-резиденции PolArt Марии Плотниковой «Магический реализм Заполярья» . «Наше картографическое или космографическое путешествие в Арктику мотивируется стремлением раскрыть Истину Севера как образ и смысл бытия, – говорит о проекте его куратор, арт-директор красноярского Музейного центра «Площадь Мира» Сергей Ковалевский. – Мы исходим из того, что значение духа и буквы Севера для роста человеческой личности еще неявное, но потенциально решающее. Особенно в такой северной стране, как Россия. Выставка пространств, соединения разных времен и разных видов искусств с вкраплениями документальных фактов и артефактов – это «из всех орудий салют» в сторону Севера». Выставку «Идея Севера» можно увидеть в Музейном центре «Площадь Мира» до 16 августа. Уточнить расписание и приобрести билеты можно заранее на сайте «Площади Мира» .	16.08.2026	\N	Норильск	\N	\N	Администрация города Норильска	\N	https://xn--h1aecgfmj1g.xn--p1ai/participate/61245/	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/e5833a1a5bfeecef2887f78ec014fa1147ce8ab5cb8efd45338da1c6664f424c.jpg	http://localhost:9000/afisha-images/picture1.png	\N
18	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	norilsk_official	Официальный сайт города Норильска	Спортивные мероприятия ко Дню России	Афиша мероприятий Уважаемые жители города Норильска, взрослые и дети, присоединяйтесь к масштабному событию! В программе: выставки, мастер-классы, песни, танцы и, конечно, же насыщенная и супер интересная спортивная площадка! Управление по спорту приглашает всех попробовать свои силы в различных видах спорта на результат, а также повеселиться с семьей и друзьями на интерактивных площадках. 12 июня 2026 года с 14:00 до 17:00 на территории Центрального района «площадь Гвардейская» запланировано проведение следующих спортивных мероприятий, посвященных Дню России: соревнования по стритболу 3х3; турнир по мини-футболу; турнир по армрестлингу; турнир по шашкам. Также в рамках мероприятия будут функционировать интерактивные площадки: народные игры: классики, резиночки, городки, бадминтон, скакалка для жителей города Норильска; дорожный патруль: электромобили, велосипеды для детей города Норильска; армтяга; дартс; силовой экстрим; площадка ГТО. Участвуй, побеждай, получай призы и отличное настроение!	12.06.2026	14:00	Норильск	\N	\N	Администрация города Норильска	\N	https://xn--h1aecgfmj1g.xn--p1ai/participate/61213/	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/6bc5f09639ffe61518e6cd3c565db1bf94c15a3057c47e53881a67f2affa4c1a.jpg	http://localhost:9000/afisha-images/picture1.png	14:00
24	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	cinema_rodina	Кинотеатр Родина	День России 2026	День России 2026 Печать Проведите День России вместе с кинокомплексом «Родина»! 🎬🍿 12 июня — особенный праздник, и мы приготовили для вас и ваших детей идеальную праздничную программу! Вас ждут любимые богатырские подвиги, море юмора и захватывающие исторические приключения: 🌟 12:00 — х/ф «Алеша Попович и Тугарин змей» (6+). Начнем день с легендарной истории о том, как Алеша Попович золото ростовское возвращал. Смех и отличное настроение гарантированы! 🌟 14:00 — х/ф «Добрыня Никитич и змей Горыныч» (6+). Продолжаем марафон вместе с рассудительным Добрыней, который отправляется на спасение княжеской племянницы Забавы. 🌟 15:30 — х/ф «Илья Муромец и Соловей Разбойник» (6+). Главный богатырь земли русской выходит на тропу справедливости, чтобы вернуть государственную казну и проучить коварного злодея. 🌟 17:00 — х/ф «Крепость: Щитом и мечом» (6+). Завершит наш праздничный показ вдохновляющая и героическая история о мужестве, преданности и защите родного Смоленска. Пригласительные билеты можно БЕСПЛАТНО получить в кассе кинокомплекса «Родина». Количество мест ограничено, лучше забрать билеты заранее ☺️ Подробности Опубликовано: 04 июня 2026 Просмотров: 56	12.06.2026	12:00	Норильск	0	\N	Кинотеатр Родина	6+	https://кино-родина.рф/	event	processed	2026-06-23 13:19:33.496774	\N	https://xn----8sblociwdfbv.xn--p1ai/images/icethumbs/212x315/100/images/Принцесса_цирка.jpg	http://localhost:9000/afisha-images/picture1.png	12:00
26	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	cinema_rodina	Кинотеатр Родина	Эхо IV Международного фестиваля фильмов для детей и юношества «Герой» к Международному дню защиты детей	Эхо IV Международного фестиваля фильмов для детей и юношества «Герой» к Международному дню защиты детей Печать Большой праздник кино для всей семьи ко Дню защиты детей! Друзья, 31 мая встречайте Эхо IV Международного фестиваля фильмов для детей и юношества «Герой». Это уникальная возможность увидеть лучшие новинки анимации на большом экране: 13:00 — «ЛУНТИК. ВОЗВРАЩЕНИЕ ДОМОЙ» . Любимый герой возвращается! Узнайте, какие новые приключения ждут Лунтика и его друзей. 15:00 — «ИВАН ЦАРЕВИЧ И СЕРЫЙ ВОЛК 6» . Продолжение любимой сказочной франшизы. Вас ждут юмор, магия и, конечно же, спасение Тридевятого царства! 17:00 — «ТРИ БОГАТЫРЯ. НИ ДНЯ БЕЗ ПОДВИГА» . Новые героические истории о самых известных богатырях. Смех и приключения гарантированы! Где: Видеозал кинокомплекса «Родина». Вход: по пригласительным билетам. Их можно получить бесплатно в кассе кинокомплекса. #событие_в_Родине Подробности Опубликовано: 28 мая 2026 Просмотров: 58	31.05.2026	13:00	Норильск	0	\N	Кинотеатр Родина	\N	https://кино-родина.рф/	event	processed	2026-06-23 13:19:33.496774	\N	https://xn----8sblociwdfbv.xn--p1ai/images/icethumbs/212x315/100/images/Принцесса_цирка.jpg	http://localhost:9000/afisha-images/picture1.png	13:00
28	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	cinema_rodina	Кинотеатр Родина	День полярника 2026	День полярника 2026 Печать 🧊 Наш город — наши правила: празднуем День полярника в «Родине»! Пусть Норильск географически и не на самом полюсе, но дух Арктики у нас в крови! По традиции кинокомплекс «Родина» приглашает прикоснуться к тайнам ледяного континента на Всероссийской акции «День полярного кино». 23 мая наш видеозал превратится в портал за полярный круг. В программе — сразу три роскошных документальных хита, от которых побегут мурашки: 14:00 - «В прятки с полярными китами» Уже 30 лет российские океанологи проводят лето на Белом море у мыса Белуший. Сюда испокон веков приплывают белые киты. Удалось ли человеку наладить настоящий контакт с морскими гигантами? Узнаем вместе. 15:00 - «Ветреные будни». История выживания и веры на краю земли — острове Беринга (Командорские острова). Как ужиться с суровой, беспощадной стихией и не потерять себя? Главный герой — священник Владимир Миронов, приехавший служить в эту далекую точку планеты. Ожидание и реальность: совпали ли они на этот раз? 16:00 - «Белое безмолвие». Фильм-посвящение Николаю Евгенову — легендарному русскому гидрографу и исследователю Арктики. В основе картины — уникальные исторические хроники и редкие архивные кадры. Вы буквально почувствуете дыхание истории и вечных льдов. Как попасть? Вход бесплатный, но по пригласительным билетам. Забирайте свой билет на кассе «Родины», пока они есть в наличии! До встречи в кино! Подробности Опубликовано: 22 мая 2026 Просмотров: 65	23.05.2026	14:00	Норильск	\N	\N	Кинотеатр Родина	\N	https://кино-родина.рф/	event	processed	2026-06-23 13:19:33.496774	\N	https://xn----8sblociwdfbv.xn--p1ai/images/icethumbs/212x315/100/images/Принцесса_цирка.jpg	http://localhost:9000/afisha-images/picture1.png	14:00
55	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	talnah_dshi_news	Талнахская детская школа искусств (Новости)	«Северные Истории»	Поздравляем учащихся художественного отделения Талнахской детской школы искусств с открытием выставки «Северные истории»! Экспозиция выставки, посвященной Году единства народов России, разместилась в Талнахском филиале МВК «Музея Норильска». В своих творческих работах юные художники - Моисеева Анастасия, Рудницкая Софья, Зубарева Алёна, Дряева Даниела, Сикорская Карина, Мурачёва Алиса, с невероятной теплотой и вниманием к деталям, изобразили быт и предания коренных народов Севера. Основную часть выставки составляют красочные иллюстрации к долганским, чукотским и эвенкийским сказкам, выполненные под руководством преподавателя Марины Александровны Свиридовой.	\N	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482078	news	processed	2026-06-23 13:19:33.496774	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
56	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	talnah_dshi_news	Талнахская детская школа искусств (Новости)	Поздравляем!	Поздравляем учащихся художественного отделения Талнахской детской школы искусств с отличными результатами в Межрегиональном очном конкурсе для учащихся детских художественных школ и художественных отделений детских школ искусств «Акварельная живопись - 2026» I Возрастная группа 12-13 лет Лауреат III степени - Моисеева Анастасия (преп. М.А. Свиридова) Лауреат III степени - Антонова Анастасия (преп. Е.А. Ионина) Дипломант - Магомедова Алина (преп. Е.А. Ионина) Дипломант - Субеева Алиса (преп. Т.А. Панащенко) Дипломант - Мухина Варвара (преп. О.Г. Биченова) Дипломант - Горбунова София (преп. Е.А. Ионина) II возрастная группа 14-15 лет Лауреат I степени - Дегтярёва Евгения (преп. Е.А. Ионина) Лауреат II степени - Сикорская Карина (преп. М.А. Свиридова) Лауреат II степени - Гордиенко Валерия (преп. Е.А. Ионина) Лауреат II степени - Пчелинцева Алина (преп. Е.А. Ионина) Лауреат III степени - Борисенкова Татьяна (преп. М.А. Свиридова) Лауреат III степени - Петрова Кира (преп. Т.А. Панащенко) Лауреат III степени - Солдатова Виктория (преп. Л.В. Гурская) III возрастная группа 16-17 лет Лауреат II степени - Кравченко Варвара (преп. Е.А. Ионина) Лауреат III степени - Охотникова Анастасия (преп. Е.А. Ионина) Лауреат III степени - Ганшина София (преп. Е.А. Ионина) Лауреат III степени - Варнакова Анастасия (преп. Е.А. Ионина) Лауреат III степени - Бут Вероника (преп. Е.А. Ионина) Учредитель конкурса: Управление культуры и развития туризма администрации города Чебоксары Организатор конкурса: МБУ ДО «Чебоксарская детская художественная школа №6 имени Акциновых» В 2026 году в конкурсе приняло участие более 630 учащихся из 30 регионов Российской Федерации и 60 образовательных учреждений. В течении четырех часов юные художники писали тематические натюрморты в технике акварельной живописи. Как это было: vk.ru/wall-217508961_1850 Поздравляем учащихся и их преподавателей с Победами и желаем дальнейшего вдохновения и новых побед!!!	\N	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482077	news	processed	2026-06-23 13:19:33.496774	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
57	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	talnah_dshi_news	Талнахская детская школа искусств (Новости)	Поздравляем Победителей!	Преподаватели - художники Талнахской детской школы искусств стали победителями Международного конкурса художественного творчества «АРТ-ПРОСТРАНСТВО ВАРТА». Конкурс проходил в городе Нижневартовске в рамках VII Международного творческий фестиваля с одноимённым названием. Номинация «ГРАФИКА» (профессионалы) Диплом I степени - Свиридова Марина Александровна Диплом II степени - Благов Михаил Юрьевич Диплом III степени - Панащенко Татьяна Андреевна Номинация «ЖИВОПИСЬ» (профессионалы) Диплом I степени - Ионина Елена Алексеевна Диплом II степени - Панащенко Татьяна Андреевна Организаторы фестиваля: ФГБОУ ВО «Нижневартовский государственный университет», г. Нижневартовск, Россия; НАО «Казахский Национальный педагогический университет имени Абая», г. Алматы, Республика Казахстан; ТОО «Международный университет Астана», г. Астана, Республика Казахстан; БУ «Колледж-интернат Центр искусств для одаренных детей Севера», г. Ханты-Мансийск, Россия; БУ «Сургутский колледж русской культуры им. А.С. Знаменского», г. Сургут, Россия. Поздравляем и желаем новых творческих побед и вдохновения!!!	\N	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482072	news	processed	2026-06-23 13:19:33.496774	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
58	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	talnah_dshi_news	Талнахская детская школа искусств (Новости)	«Корпорация звёзд»	Фестиваль творчества «Корпорация звёзд»: мастер-класс по росписи 24 мая в СпортХолле «Айка» в рамках корпоративного фестиваля творчества «Корпорация звёзд» состоялся мастер-класс по росписи тарелок. Его провела Арина Андреевна Ликонцева - художник, керамист, член Международного союза педагогов-художников, преподаватель Талнахской детской школы искусств. К творческой встрече присоединились работники филиалов и РОКС Компании. Под руководством опытного наставника участники познакомились с техникой росписи по керамике акриловыми красками, изучили особенности материалов и освоили основные приёмы работы. На первом этапе Арина Андреевна подготовила эскизы с изображением архитектуры Норильского Никеля. Каждый участник смог выбрать композицию по душе и воплотить собственную творческую идею, создав уникальное изделие. Мастер-класс подарил гостям массу положительных эмоций, которые нашли отражение в ярких и самобытных работах. Это событие стало ещё одним шагом к развитию творческого потенциала и укреплению корпоративного духа!	24.05.2026	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482069	news	processed	2026-06-23 13:19:33.496774	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
59	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	talnah_dshi_news	Талнахская детская школа искусств (Новости)	Поздравляем!!!	Поздравляем!!! 23 мая в праздничной атмосфере в Талнахской детской школе искусств прошли самые долгожданные и волнительные выпускные! В этом году стены родной школы покинули талантливые и вдохновленные ребята музыкального , художественного , театрального и хореографического 🩰 направлений. За годы упорного и творческого труда наши выпускники освоили тонкое искусство звука, цвета, слова и танца, успешно завершили обучение и сделали уверенный шаг на новый, большой жизненный путь! Мы невероятно гордимся каждым из вас, дорогие наши выпускники! Пусть этот старт откроет перед вами двери к самым смелым мечтам, а творческая искра , зажженная в стенах школы искусств, ярко освещает вашу дорогу всю жизнь. В добрый час, в добрый путь!	23.05.2026	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482065	news	processed	2026-06-23 13:19:33.496774	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
60	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	talnah_dshi_news	Талнахская детская школа искусств (Новости)	​ Поздравляем!!! ​	23 мая в Талнахской детской школе искусств прошла торжественная церемония вручения дипломов выпускникам художественного отделения. Этот день стал важным событием как для самих выпускников, так и для их преподавателей и родителей. В 2026 году дипломы получили выпускники, успешно освоившие предпрофессиональные и общеобразовательные программы. Предпрофессиональные программы «Живопись» - классные руководители: Наталия Николаевна Цаль и Любовь Владимировна Гурская «Дизайн» - классный руководитель: Татьяна Андреевна Панащенко Общеобразовательные программы «Основы ИЗО» - классный руководитель: Андрей Сергеевич Попов «Мир внутри меня» «Перспектива» - классный руководитель: Елена Алексеевна Ионина «Оттенки дизайна» - классный руководитель: Татьяна Андреевна Панащенко Поздравляем выпускников! Желаем вам дальнейших успехов в творчестве, вдохновения и новых профессиональных высот! Пусть полученные знания и навыки станут прочной основой для будущих свершений, а искусство всегда будет важной частью вашей жизни!	23.05.2026	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482063	news	processed	2026-06-23 13:19:33.496774	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
61	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	talnah_dshi_news	Талнахская детская школа искусств (Новости)	Защита дипломных работ ДПОП "Живопись" 8 "В"	Защита дипломных работ! 21 мая в Талнахской детской школе искусств состоялась итоговая аттестация учащихся 8 «В» класса предпрофессиональной программы «Живопись». Выпускники представили комиссии свои дипломные работы по станковой композиции, выполненные под руководством преподавателя Наталии Николаевны Цаль. Экзаменационную комиссию возглавил председатель Дмитрий Вениаминович Бакланов, преподаватель художественного отделения Кайерканской детской школы искусств. В состав комиссии вошли преподаватели художественного отделения: Е.А. Ионина, М.Ю. Благов и А.С. Попов. Члены комиссии высоко оценили творческий подход, мастерство и глубину проработки тем, представленных выпускниками. В своих работах юные художники затронули широкий спектр жизненных явлений. Среди тем дипломных композиций были представлены: Спорт-динамичные и эмоционально насыщенные сюжеты, передающие энергию движения. Духовная жизнь и церковные праздники: работы, наполненные уважением к традициям Отдых и рыбалка Труд Колорит южной страны Защита дипломов стала ярким событием, подтвердившим высокий уровень подготовки учащихся и профессионализм педагогического состава. Поздравляем выпускников с успешным завершением важного этапа обучения!	21.05.2026	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482057	news	processed	2026-06-23 13:19:33.496774	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
62	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	talnah_dshi_news	Талнахская детская школа искусств (Новости)	Защита дипломных работ ДПОП "Живопись" 8 "Б"	21 мая в Талнахской детской школе искусств состоялся значимый день - защита дипломных работ выпускников 8 «Б» класса предпрофессиональной программы «Живопись» по предмету «Станковая композиция», преподаватель Марина Александровна Свиридова. Это событие стало итогом нескольких лет упорного труда, творческого поиска и профессионального роста юных художников. В торжественной обстановке выпускники представили свои итоговые композиции. Каждая работа - это не просто учебное задание, а отражение внутреннего мира автора, его взгляда на окружающую действительность, умение выразить эмоции и идеи. Темы дипломов были разнообразны: размышления на тему дружбы, судьбы человека, спорта и культуры других стран. Особое внимание на защите уделялось не только техническому исполнению, но и глубине замысла, оригинальности подхода. Председатель комиссии Дмитрий Вениаминович Бакланов, преподаватель художественного отделения Кайерканской ДШИ, высоко оценил творческие работы и отметил высокий уровень подготовки выпускников, их творческий потенциал и зрелость художественного мышления. Поздравляем с Отличной защитой дипломов и желаем дальнейших успехов и творческого вдохновения!!!	21.05.2026	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482051	news	processed	2026-06-23 13:19:33.496774	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
63	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	talnah_dshi_news	Талнахская детская школа искусств (Новости)	Защита диплома ДПОП "Дизайн"	Поздравляем с успешной защитой дипломных проектов! 21 мая учащиеся художественного отделения предпрофессиональной программы «Дизайн» под руководством преподавателя Татьяны Андреевны Панащенко успешно представили и защитили свои дипломные работы по благоустройству территорий и арт-объектам. Это событие стало важным этапом в их творческом и профессиональном становлении. Председатель комиссии Дмитрий Вениаминович Бакланов, преподаватель художественного отделения Кайерканской ДШИ, высоко оценил проекты выпускников, отметив качество и основательный подход учащихся к своим работам. В рамках дипломных проектов выпускники продемонстрировали не только высокий уровень художественного мастерства, но и умение мыслить концептуально, работать с современными тенденциями в дизайне и находить оригинальные решения для самых разных задач. Каждый проект отличался индивидуальным стилем, глубоким смыслом и профессиональной подачей. Особую благодарность выражаем Татьяне Андреевне за её педагогический талант, поддержку и вдохновение, которые она дарит своим ученикам. Благодаря её наставничеству молодые дизайнеры смогли раскрыть свой потенциал и уверенно защитить проекты. Желаем выпускникам дальнейших творческих успехов и ярких идей!	21.05.2026	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482046	news	processed	2026-06-23 13:19:33.496774	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
65	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	talnah_dshi_news	Талнахская детская школа искусств (Новости)	Выпускные экзамены	Выпускные экзамены на музыкальном отделении: юные таланты демонстрируют мастерство 21 мая на музыкальном отделении успешно прошли выпускные экзамены по специальности. Юные музыканты с честью представили насыщенную программу, включавшую четыре произведения различных эпох, стилей и жанров. В этом году ряды выпускники -инструменталисты заканчивают обучение по следующим предпрофессиональным образовательным программам: * Фортепиано * Струнные инструменты * Духовые и ударные инструменты * Народные инструменты Высокую планку мастерства выпускникам помогли задать их наставники: преподаватели О.В. Благова , Л.А. Овсянникова, Л.Ф. Решетникова, Ю.Г. Голощапова , В.Г. Несова, С.Е. Горяева , П.С. Толстокоров, Л.Ф. Костенко и Р.М. Карпов . Экзаменационные работы оценивали профессионалы высокого класса. Председателями комиссий выступили: преподаватели Норильского колледжа искусств и Норильской детской школы искусств - Дмитрий Викторович Васильев, Елена Анатольевна Чернышева и Владимир Викторович Шикера. Они поздравили выпускников с достойным выступлением и дали объективную оценку их исполнению. Поздравляем наших талантливых учащихся, их преподавателей и родителей с достижением долгожданной цели! Желаем выпускникам успехов на заключительном экзамене по музыкальной литературе!	21.05.2026	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482042	news	processed	2026-06-23 13:19:33.496774	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
69	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	talnah_dshi_news	Талнахская детская школа искусств (Новости)	​ «Музыкальные фантазии»: концерт, который ЖДАЛИ! ​	16 мая 2026 года на сцене Городского концертного зала, в Норильском колледже искусств состоялось долгожданное выступление Ольги и Владимира Кузнецовых — преподавателей НКИ и Талнахской ДШИ . Их дуэт домры и баяна продемонстрировал виртуозный живой диалог и настоящую магию звука! Вечер открыли страстные «Пять испанских картин» А. Кусякова. На смену им пришло глубокое сольное произведение В. Киулафидеса «Indifferenzia» в переложении Ольги Кузнецовой для домры. Смелым экспериментом стало исполнение знаменитого концерта А. Вивальди «Зима», где домра пела как ледяная скрипка, а баян заменил целый оркестр. 🪗 Ностальгическую ноту внесла Фантазия В. Черникова на тему песни «Одинокая гармонь», отметившей в этом году 80-летний юбилей. Особое впечатление на публику произвели ансамблевые номера: Экспрессивное «Посвящение Астору Пьяццолле» В. Зубицкого в исполнении Владимира Кузнецова (баян) и Ольги Благовой (фортепиано); Джазовая Фантазия на темы оперы Дж. Гершвина «Порги и Бесс», которую виртуозно представили Ольга Кузнецова (домра) и Юлия Елизарова (фортепиано). Дополнением к звучащей музыке стали живописные иллюстрации - картины, созданные преподавателями - художниками Талнахской детской школы искусств -Михаилом Благовым, Ольгой Биченовой, Еленой Иониной , Наталией Цаль , Ариной Ликонцевой и Мариной Свиридовой . Картины сменяли друг друга на экране. Музыка обрела цвет, форма – эмоцию, а зритель – полное погружение в образ! Спасибо всем, кто был с нами в этот вечер! Спасибо артистам: Ольге и Владимиру Кузнецовым, Ольге Благовой, Юлии Елизаровой. Спасибо художникам Талнахской ДШИ — вы сделали музыку видимой. Спасибо зрителям за ваши горящие глаза и овации Пусть такие концерты становятся традицией. Потому что, когда настоящие мастера собираются вместе, рождается не просто музыка — рождается чудо.	16.05.2026	\N	Талнах	\N	\N	Талнахская детская школа искусств	\N	https://talnah-dshi.ru/item/2482035	news	processed	2026-06-23 13:19:33.496774	\N	https://www.leocdn.ru/uploadsForSiteId/203770/siteHeader/e8c7b4c9-9968-4733-9674-3f884dfaf8b1.jpg	http://localhost:9000/afisha-images/picture1.png	\N
70	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	ЕДИНСТВОМ СИЛЬНА РОССИЯ	Дорогие друзья! Приглашаем вас на Отчетный концерт творческих коллективов Норильской детской школы искусств, который состоится 25 апреля в 15.00ч! В отчетном концерте школы примут участие: -Ансамбли фортепианного отделения; -Оркестр русских народных инструментов (руководитель Рустам Шайхисламов); -Духовой оркестр (руководитель Михаил Захарьяш); -Камерный оркестр (руководитель Владимир Быкадоров); -Детские фольклорные ансамбли «Соловушки» (рук. Алена Сергейчик), «Горошины» (рук. Александра Качинская), «Карусель» (рук. Анна Шунц) - Сводный хор (рук. Ферида Зейналова и Валерия Плужник). Вход по пригласительным билетам (46-90-02)	25.04.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2453804	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
71	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	НАШИ ДВЕРИ ВНОВЬ ОТКРЫТЫ!	18 апреля в 15:00 в Концертном зале школы искусств состоится концерт в рамках проведения Дня открытых дверей . Мы приглашаем юных норильчан и родителей стать частью нашей большой творческой семьи и предлагаем: познакомиться с палитрой и звучанием разнообразных музыкальных инструментов, определиться с выбором музыкального направления, вы сможете написать заявление в тот же день и получить информацию о работе приёмной комиссии. справки: 46-90-05, 8913-465-59-33. С нетерпением ждем вас!	18.04.2026	15:00	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2447590	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	15:00
73	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	НАЧИНАЕМ ГОД С ПРЕМЬЕРЫ!	20 января в Концертном зале школы искусств юные и взрослые норильчане побывают на премьере оперы-мюзикла С. Плешака "Золушка"! Это долгожданное событие является итогом большого творческого труда исполнителей. Историю Золушки при поддержке программы развития социального капитала "Люди территории" компании "Норникель" представят более 40 участников из числа учащихся школы искусств и преподавателей. Зрителей ждет волшебное представление, в котором соединяются воедино музыка, танец, вокальные и актерские способности участников, яркие костюмы и красочные декорации. На этой неделе пройдут генеральные репетиции оперы-мюзикла, каждая из которых приближает всех нас ко дню премьеры. До встречи в мире музыкального театра, дорогие друзья! Вход по пригласительным билетам (469002).	20.01.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2382520	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
74	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	ЗИМНИЕ ЗАРИСОВКИ	Дорогие друзья! Осталось чуть более двух недель до наступления Нового года! Почувствовать атмосферу наступающего праздника в суматохе дел и в веренице событий бывает непросто. Самое время ощутить волшебное настроение зимнего праздника! Мы приглашаем юных и взрослых норильчан всей семьёй посетить новогодний концерт Образцового хореографического ансамбля "Созвездие " . Яркие образы, гирлянда танцевальных номеров в исполнении младшего, среднего и старшего состава ансамбля принесут вам незабываемые впечатления и подарят новогоднее настроение! Концерт состоится 20 декабря в 17 часов в Концертном зале школы искусств. Билеты в кассе НДШИ.	20.12.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2365983	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
75	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	МАРШРУТ ПОСТРОЕН!	Дорогие друзья! На календаре декабрь, а это означает, что Новый год уже совсем скоро! Каждый предновогодний день приближает нас к празднику, погружает в атмосферу волшебства и чудес. В ожидании наступающих праздников предлагаем вам посетить марафон концертных мероприятий декабря и зарядиться положительными эмоциями и добродушным настроением! 10 декабря в 18.30 СТРУННАЯ ФАНТАЗИЯ (концерт учащихся и преподавателей отделения "Струнные инструменты") 16 декабря в 19.00 НАШИ ПЕРВЫЕ ШАГИ В МУЗЫКУ (концерт класса преподавателя О. Е. Соколовой) 18 декабря в 18.30 ЗИМНИЕ МЕЛОДИИ (концерт учащихся отделения "Общий курс фортепиано") 20 декабря в 12.00 ОТЧЁТНЫЙ КОНЦЕРТ ОТДЕЛЕНИЯ РАННЕГО ЭСТЕТИЧЕСКОГО РАЗВИТИЯ 22 декабря в 18.30 НАПОЛНИМ ПЕСНЕЙ КАЖДОЕ МГНОВЕНЬЕ (концерт отделения хорового пения)	10.12.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2361033	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
79	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	ЗИМНИЕ ЗАРИСОВКИ	Осталось совсем немного времени до волшебного дня, где вы сможете увидеть на сцене Концертного зала Норильской детской школы искусств выступление Образцового хореографического ансамбля "Созвездие! Кто ещё не успел приобрести билетики, звоните в кассу НДШИ по номеру 46-90-02 Будние дни с 9.00-17.00, перерыв с 13.00-14.00.	12.12.2024 09:19	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2082778	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
80	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	НОВОГОДНИЙ СЕРПАНТИН: ПРАЗДНИК НАЧИНАЕТСЯ ЗДЕСЬ!	Дорогие друзья! Наступает особенное время ожидания Нового года! С каждым днем декабря этот волшебный и по-настоящему семейный праздник становится ближе. И взрослые, и дети ждут его с радостным волнением, ведь в нем столько чудес и волшебства! Приглашаем разделить с нами предновогоднее настроение! Ждем вас 21 декабря в 14.00 и 17.00 часов на традиционном для школы искусств мероприятии «Новогодний серпантин!». Мы знаем, как создать праздничную атмосферу и сохранить её на все новогодние каникулы! Давайте заряжаться новогодним настроением вместе!Билеты можно приобрести в кассе НДШИ в будние дни с 9:00-17:00, обед 13:00-14:00 Тел. Кассы: 46-90-02 Цена билета: 300 рублей	21.12.2026	09:00	Норильск	300 ₽	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2076491	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	09:00
82	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	ПУТЕШЕСТВИЕ В БАБАРИЮ	23 ноября в Концертном зале школы искусств состоятся 2 концерта инструментального квартета с оригинальным названием «STRADIVALENKI» (Москва) в рамках просветительского проекта "Филармонические встречи" , который включает в себя цикл музыкальных вечеров. В 13:00 мы приглашаем школьников Норильска и учащихся образовательных учреждений культуры на интерактивную детскую музыкальную программу "Путешествие в Бабарию". В программе прозвучит музыка Ф. Пуленка, Й. Гайдна, Л. Дакена, К. Сен-Санса. Цена билета - 250руб. Билеты в кассе НДШИ: 46-90-02 Тел. для справок: 8-913-161-06-26 Чтобы приобрести билеты на вечерний концерт, смотрите следующую афишу.)	23.11.2026	13:00	Норильск	250 ₽	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2036910	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	13:00
83	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	КЛАССИКА, КОТОРАЯ УЛЫБАЕТСЯ	А в 18:00 музыканты выступят с концертной программой "Классика, которая улыбается" , которая будет интересна профессиональным музыкантам и любителям музыки. Норильчане смогут услышать произведения других не менее известных композиторов, среди которых: И.С. Бах, А. Вивальди, П. Чайковский, И. Брамс и другие. Дочитав этот пост, спешите сразу же приобрести билеты! До встречи на концертах современного музыкального коллектива с ярким тембровым звучанием и разнообразным репертуаром! Цена билета - 500руб. Билеты в кассе НДШИ: 46-90-02 Тел. для справок: 8-913-161-06-26	30.10.2024 05:45	18:00	Норильск	500 ₽	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2036909	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	18:00
85	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	ПУТЕШЕСТВИЕ ПО ЭПОХАМ	Уже в эту субботу (19 октября) в 17:00 состоится концерт лауреатов всероссийского и международного конкурсов с участием Подкаменной Катерины, Северухиной Александры, Семенец Любови и Литвинюк Людмилы класс преподавателя Афендиковой Ларисы Витальевны, а также преподаватель школы, незаменимый иллюстратор - Елена Анатольевна Чернышева. Приглашаем всех желающих стать поддержкой для наших вновь будущих юных конкурсанток и просто насладиться великолепной музыкой. Вход свободный. Тел. для справок: 89131610626	19.10.2026	17:00	Норильск	0	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2024665	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	17:00
88	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	ПОДВОДЯ ИТОГИ	Итак, дорогие друзья. Не за горами время летнего отдыха и нам всем хочется скорее подвести итоги этого насыщенного учебного года, наполненного новыми творческими идеями, достижениями, открытиями и победами в конкурсах. Поэтому случаю, мы приглашаем вас на Отчетный концерт творческих коллективов Норильской детской школы искусств, который состоится 27 апреля в 17.00ч! В отчетном концерте школы примут участие: -Солисты и ансамбли фортепианного отделения; -Оркестр русских народных инструментов (руководитель Рустам Шайхисламов); -Духовой оркестр (руководитель Михаил Захарьяш); -Камерный оркестр (руководитель Владимир Быкадоров); -Детские фольклорные ансамбли «Соловушки» (рук. Алена Сергейчик), «Кудесники» (рук. Наталья Абозина); -Хоровые коллективы (рук. Ферида Зейналова и Валерия Плужник) -Солисты: Елена Пивоварова, Наталья Абозина, Алена Сергейчик, Анна Шунц, Павел Сирош, Эльшан Гейбатов и Николай Глухов.	27.04.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/1865978	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
90	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	ДЕНЬ ТАТАРСКОЙ КУЛЬТУРЫ	На прошлой неделе в Норильской детской школе искусств прошел открытый урок на тему: "День татарской культуры". Что мы знаем об этом народе? Какая у него культура, национальная одежда и обычаи? Именно об этом узнали и поговорили учащиеся школы. Интересными фактами стали: - При визите гостя татары по традиции расстилают праздничную скатерть и подают самые лучшие угощения; - Цвета у татарского костюма восточные, яркие: зеленый, бордовый, синий; - Самый популярный татарский праздник - Сабантуй (Праздник окончания полевых весенних работ). Посмотреть на гуляния съезжаются туристы со всей России; - Самые значимые жанры татарской традиционной музыки - вокальные. Музыкальные инструменты использовались в основном как аккомпанемент к пению; - Татарские музыканты выработали собственную манеру игры: если русские широко использовали гармонические возможности гармошки (играли на ней аккорды, поддерживающие мелодию голоса), то татары освоили ее преимущественно как мелодический инструмент, стремясь воспроизвести орнаментальные мелодии в высоком регистре, как это делали раньше на курае или народной скрипке.	26.05.2026 09:39	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2476768	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
91	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	КЛАРНЕТ В ЦЕНТРЕ ВНИМАНИЯ	12 мая в рамках работы Образовательного центра Ю. Башмета состоялись мастер-классы преподавателя РАМ имени Гнесиных Евгения Варавко (кларнет). В них приняли участие учащиеся школы искусств Валерий Дмитришин, Владислав Шевченко (преп. Самарцев В.Е.), Ярослав Четвергов и Вячеслав Горохов (преп. Самарцев Е.Ю.). Каждый участник получил профессиональные советы по работе над произведениями учебной программы, где важен каждый нюанс: дыхание, фразировка, аппликатура, исполнительская техника и многое другое. Особенной ценностью мастер-классов является их атмосфера - творческая, продуктивная, вдохновляющая. Юные музыканты ощутили себя частью большого сообщества увлечённых своим делом специалистов. Для каждого из них - это способ развития навыков самостоятельной творческой деятельности и стимул к дальнейшей работе.	12.05.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2469806	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
93	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	МЫ МИР РАСКРАСИМ ГОЛОСАМИ	Можно ли петь без души? Ответ на этот вопрос дала теплая атмосфера отчетного концерта учащихся отделения хорового пения, который состоялся 30 апреля в Малом зале школы искусств. В концерте прозвучало 14 задорных вокальных композиций о детстве известных отечественных композиторов: М. Дунаевского, В. Шаинского, М. Минкова, Е. Крылатова, Б. Савельева, А. Кудряшова и др. Голоса солистов и хора объединили всех присутствующих в единстве эмоций добра и душевной гармонии. Выступили юные солисты : Саша Панкратова, София Морева, Саша Усова, Арина Никифорук, Оля Ермолаева, Катя Мочалова, Виктор Булаев, Саша Суворов. Они покоряли искренностью, артистизмом, самоотдачей, одним словом - пением от всего сердца! В концерте приняли участие : вокальный ансамбль хористов 2 класса "Улыбка"; три вокальных дуэта (Агния Прядко и Миша Попов, Елизавета Махнева и Милослава Новицкая, Алена Курьянова и Василиса Сирош); младший и смешанный хоры. Выступление коллективов показало, что каждый голос ценен и насколько важно умение слышать друг друга. Каждый участник хора чувствовал себя частью большой и дружной хоровой семьи! Отчетный концерт подготовили: преподаватели хорового отделения Валерия Плужник и Ферида Зейналова, концертмейстеры Александра Баранова, Софья Кулаковская. Ведущие: выпускницы отделения Алена Курьянова и Дарья Моисеенкова - справились со своей задачей на отлично! Благодарим педагогов за творческий подход к организации мероприятия, а родителей - за внимание и тёплую поддержку!	30.04.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2462880	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
95	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	ДАВАЙТЕ ИГРАТЬ ВМЕСТЕ	Концерт с таким названием состоялся 28 апреля в Концертном зале школы искусств. Он объединил на одной сцене две музыкальные стихии - домру и фортепиано. В исполнении учащихся и преподавателей школы прозвучала музыка различных эпох и жанров. Главным исполнителем вечера стала преподаватель по классу домры Елена Чернышева , выступив как иллюстратор с юными концертмейстерами - учащимися класса заслуженного работника культуры Красноярского края Л.В. Афендиковой . Итогом творческого сотрудничества в концертмейстерском классе двух преподавателей и учащихся по классу фортепиано Л. Семенец, К. Подкаменной, Л. Литвинюк, А. Северухиной являются на протяжении последних трех лет победы юных пианисток в амплуа концертмейстера в конкурсах различных статусов в Норильске, Уфе, Гатчине, Вологде, Гурьевске, Ижевске. В этих конкурсах профессиональный исполнительский уровень Елены Чернышевой был отмечен дипломами "Лучший иллюстратор". Имея большой опыт как сольного исполнителя и участника ансамблей различных составов, Елена Чернышева много лет успешно совмещает это с педагогической деятельностью. В концерте выступили ее ученики: Мария Малик и Алексей Зелинский, которые вслед за своим учителем раскрывают свой потенциал в музыкальном исполнительстве. Выступление с профессиональным иллюстратором в формате настоящего опыта музицирования стало для юных участников важным опытом сценического мастерства. Благодарим всех участников и Елену Чернышеву за создание неповторимой атмосферы творческого вечера!	28.04.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2461059	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
97	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	ЮБИЛЕЙНЫЙ ТРИУМФ	26 апреля на сцене Норильского Заполярного театра драмы имени В.В. Маяковского состоялся концерт Образцового хореографического ансамбля "Созвездие" , посвящённый 25-летию творческой деятельности. Юбилейная программа стала творческим отчетом, объединившим 18 лучших номеров из репертуара ансамбля разных лет и премьерные постановки. Это балетные фрагменты, народные и классические композиции. На одной сцене с основным составом ансамбля "Созвездие" выступили самые юные "звездочки" , будущие балерины - учащиеся подготовительного класса (отделение раннего эстетического развития). С 2002 года ансамбль "Созвездие" неоднократно подтверждал свое высокое звание. За свою историю коллектив завоевал множество призовых мест на межмуниципальных, всероссийских и международных конкурсах и фестивалях хореографического искусства. "Созвездие" было неоднократно отмечено специальными дипломами за сохранение классической традиции хореографии и высокий уровень сценической культуры. Успехи коллектива подтверждаются достижениями лучших его выпускников, продолживших свое обучение в лучших вузах страны и выбравших своей профессией балетную хореографию, педагогическую деятельность. Праздничный вечер зрителям подарили: - зав. костюмерной Елена Заграфова; - художник-модельер театрального костюма Елена Балашова ; - педагоги-хореографы: Кристина Баландина и Екатерина Писарева; - руководитель ансамбля, заслуженный работник культуры Красноярского края Анна Соколов а. 25 лет - это время расцвета, накопления опыта и серьёзных достижений. Юбилейный концерт стал ярким свидетельством успешного развития "Созвездия" и залогом его дальнейших творческих побед и свершений!	26.04.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2461053	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
100	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	ГРОМКИЙ РИТМ ПОБЕДЫ	2-3 апреля учащиеся школы искусств стали лауреатами I Всероссийского конкурса исполнителей на ударных инструментах "Траектория ритма" , который состоялся на базе ДШИ г. Заречный Пензенской области: лауреат 1 степени: Андреев Елисей (5 класс) лауреат 3 степени: Гритчина Анастасия (3 класс) Техничность и музыкальность исполнения конкурсной программы наших ребят оценило жюри в составе: Иванюк Влас Николаевич председатель жюри, доцент кафедры медных духовых и ударных инструментов Нижегородской государственной консерватории имени М. И. Глинки, лауреат всероссийских и международных конкурсов; Карпова Ларина Геннадьевна — руководитель Регионального центра развития образования в сфере культуры и искусства Пензенской области, заместитель директора ГБПОУ «Пензенский колледж искусств» заслуженный работник культуры Пензенской области; Чистяков Дмитрий Викторович — преподаватель ГБУДО г. Москвы «Детская школа искусств „Центр", лауреат всероссийского конкурса профессионального мастерства «Виват, музыкант!». Благодаря очно-заочному формату в конкурсе участвовали конкурсе участвовали музыканты из Москвы, Санкт Петербурга, Сызрани, Пензы, Спасска, Заречного, а также из Красноярского края и Самарской области. Поздравляем конкурсантов со значимым достижением! Благодарим преподавателя Карпова Р.М. и концертмейстера Демину Е.В. за профессиональную подготовку учащихся!	03.04.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2441506	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
101	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	МУЗЫКАЛЬНОЕ ВОСХОЖДЕНИЕ: Viva, symphony!	С 30 марта по 3 апреля в Иркутске состоялся VI Всероссийский открытый конкурс молодых исполнителей на оркестровых инструментах "Viva, symphony! ". В нем приняли участие 172 человека в возрасте до 30 лет в 5 возрастных категориях по 3 направлениям и соответствующим номинациям: Струнные инструменты Духовые инструменты Ударные инструменты Победа в таком серьёзном конкурсе - это новая страница в творческой биографии каждого нашего музыканта! Наши результаты: Сафонов Николай - лауреат I степени (преп. Степанова С.В., конц. Сирота Ж.Н.) Филатов Денис - лауреат III степени (преп. Шикера В.В., конц. Соколова О.Е.) Сыркова Елизавета - дипломант (преп. Белинская М.П., конц. Волкова Е.В.) Специального диплома "Лучший концертмейстер" удостоены концертмейстеры Соколова О.Е. и Сирота Ж.Н. Все юные музыканты приняли участие в мастер-классах членов жюри: Тростянского Александра Борисовича (скрипка) - заслуженного артиста РФ, профессора МГУ имени П.И. Чайковского; Афанасьева Марка Данатовича (виолончель) - заслуженного работника культуры Республики Башкортостан, преподавателя ССМК, доцента Уфимского государственного института искусств имени Загира Исмагилова. Поздравляем и гордимся достижениями учащихся и преподавателей! Viva, musica!	30.03.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2441502	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
102	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	ВРЕМЯ ТВОРИТЬ С НАМИ! НАБОР В НДШИ ОТКРЫТ!	Хотите, чтобы ваш ребенок не пропадал в телефоне, а создавал что-то прекрасное? Откройте ему особый мир искусства, творчества и магии сцены! Норильская детская школа искусств открывает набор на 2026/2027 учебный год по направлениям: музыкальное хореографическое Мы знаем все секреты вдохновения: Педагоги-профессионалы, мастера своего дела; уникальный Концертный зал - место, где раскрываются таланты; Творческая атмосфера концертов и конкурсов. Что важно сделать: Определиться с направлением Написать заявление. Наш адрес: ул. Б. Хмельницкого 17А, пн–пт с 09:00 до 17:00 (перерыв 13:00–14:00). Прием заявлений с 15 апреля ! Получить информацию о работе приёмной комиссии. Пройти прослушивание /отбор Справки: 46-90-05, 8913-495-59-33 Ждём вас! Искусство - фундамент успеха!	15.04.2026	09:00	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2438897	event	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	09:00
103	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	"ВЕСЕННЯЯ КАРУСЕЛЬ" НАГРАЖДАЕТ ЛУЧШИХ!	С 27 по 29 марта XII Межмуниципальный фольклорный фестиваль-конкурс «Весенняя карусель» подарил праздник народной культуры юным и взрослым жителям Норильска. 3 дня фестиваля-конкурса были насыщены творческими событиями. Каждое из них незабываемо: - концерт-открытие; - мастер-классы сопредседателя жюри Ивана Петелина; - конкурсный день, в котором выступили участники в возрасте от 6 до 90 лет; - камерный моноспектакль председателя жюри Екатерины Ряжских "На вяку, как на таку"; - закрытие фестиваля-конкурса: награждение победителей. Благодарственные письма членам жюри вручила начальник Управления по делам культуры и искусства Администрации города Норильска Инна Александровна Давыдова. Фестивальное движение стало настоящей "мозаикой культур", представленной фольклорными коллективами из: 6 образовательных учреждений культуры; 2 общеобразовательных организаций (МБОУ "СШ #33", МБОУ "СШ "28"); 2 дошкольных учреждений (д/с #82 "Сказка" и #99 "Топ-топ") А теперь - наши итоги! Поздравляем победителей фестиваля-конкурса : ДИПЛОМАНТЫ номинация "Фольклорное пение "СОЛО": ГУЗЗИТАЕВА АЛАНА (преп. Абозина Н.И., конц. Остапченко А.А.) БАТРАКОВА МАРГАРИТА (преп. Абозина Н.И., конц. Шайхисламов Р.Р.) ДУБОВА НИКА (преп. и конц. Сергейчик А.С.) ДУДЧЕНКО ИГОРЬ (преп. Шунц А.А., конц. Остапченко А.А.) ЗВЕРЕВА КРИСТИНА (преп. и конц. Сергейчик А.С.) КОБЗЕВА МИЛАНА (преп. и конц. СЕРГЕЙЧИК А.С.) ЛАРИНА КАРИНА (преп. Шунц А.А.) СВИНЦОВА РОЗАЛИЯ (преп. Сергейчик А.С., конц. Шайхисламов Р.Р.) ФЕДОРОВСКАЯ ИРИНА (преп. и конц. Шунц А.А.) ШУНЦ АННА АНДРЕЕВНА (конц. Федотовская Е.Н.) номинация "Фольклорное пение" МАЛЫЕ ФОРМЫ": ДУЭТ: БАТРАКОВА МАРГАРИТА, ДУБОВА НИКА (рук. Абозина Н.И., конц. Шайхисламов Р.Р.) ДУЭТ: ВЯЛОВА НЕЛЛИ, КАТКОВА МАРИНА (рук. Сергейчик А.С.) ДУЭТ: СТАРКОВА СВЕТЛАНА, СЕРГЕЙЧИК АЛЁНА СЕРГЕЕВНА (рук. Сергейчик А.С.) ТРИО: ЛАРИНА КАРИНА, ШУНЦ АННА АНДРЕЕВНА, АБОЗИНА НАТАЛЬЯ ИГОРЕВНА (рук. Шунц А.А.) номинация "Народное пение "СОЛО": КУШИНЦОВА АНАСТАСИЯ (преп. Сергейчик А.С., конц. Шайхисламов Р.Р.) номинация "Народное пение" МАЛЫЕ ФОРМЫ": ДУЭТ: ФЕДОРОВСКАЯ ИРИНА, БЕЗНАСЮК ЕВГЕНИЯ (рук. Шунц А.А., конц. Остапченко А.А.) ЛАУРЕАТЫ III СТЕПЕНИ номинация "Фольклорное пение "СОЛО": КУЗНЕЦОВА ЕЛИЗАВЕТА (преп. Абозина Н.И., конц. Коженок Н.В.) ШПАКОВСКИЙ АЛЕКСЕЙ (преп. Шунц А.А., конц. Остапченко А.А.) номинация "Фольклорное пение "МАЛЫЕ ФОРМЫ": КВИНТЕТ: ЛОГВИНЕЦ ТИМОФЕЙ ЕВГЕНЬЕВИЧ (НДШИ), ИВАНОВ ЕГОР ЕВГЕНЬЕВИЧ (ОДШИ), КУЗНЕЦОВА АННА СЕРГЕЕВНА, ФАДЕЕВА ПОЛИНА, САНИНА ВЕРОНИКА (НКИ) номинация "Фольклорное пение "АНСАМБЛИ": Фольклорный ансамбль "ЗАТЕЯ" (рук. Шунц А. А.) Фольклорный ансамбль "КУДЕСНИКИ" (рук. Абозина Н.И., конц. Коженок Н.В.) ЛАУРЕАТЫ II СТЕПЕНИ номинация "Фольклорное пение "СОЛО": ТЮТЮНИК МАРГАРИТА (преп. Абозина Н.И., конц. Коженок Н.В.) БУЛАТОВА УЛЬЯНА (преп. и конц. Сергейчик А.С.) ПОПОВА АННА (преп. Качинская А.А., конц. Коженок Н.В.) ПЕТРЕНКО АЛИНА (преп. Сергейчик А.С., конц. Шайхисламов Р.Р.) ЛИТВИНЮК ЛЮДМИЛА (преп. Литвинюк В. Н., конц. Зеленский Н. - НКИ) СЕРГЕЙЧИК АЛЁНА СЕРГЕЕВНА номинация "Фольклорное пение "МАЛЫЕ ФОРМЫ": ДУЭТ: ЛАРИНА КАРИНА, ЛАРИНА КРИСТИНА (рук. Шунц А.А.) ДУЭТ: ШУНЦ АННА АНДРЕЕВНА, АБОЗИНА НАТАЛЬЯ ИГОРЕВНА (рук. Шунц А.А.) ТРИО: ЛОГВИНЕЦ ТИМОФЕЙ ЕВГЕНЬЕВИЧ (НДШИ), ИВАНОВ ЕГОР ЕВГЕНЬЕВИЧ (ОДШИ), КУЗНЕЦОВА АННА СЕРГЕЕВНА (рук. Логвинец Т.Е.) номинация "Фольклорное пение "АНСАМБЛИ": Детский фольклорный ансамбль "КАРУСЕЛЬ" (рук. Шунц А. А., конц. Коженок Н.В.) Детский фольклорный ансамбль "СОЛОВУШКИ", старшая группа (рук. Сергейчик А.С., конц. Шайхисламов Р. Р.) Детский фольклорный ансамбль "ДЕВИЦЫ" (рук. Шунц А.А.) Фольклорный ансамбль "КУРОЛЕСЫ" (рук. Шунц А. А.) ЛАУРЕАТЫ I СТЕПЕНИ номинация "Фольклорное пение "МАЛЫЕ ФОРМЫ": ДУЭТ: КУЗНЕЦОВА ЕЛИЗАВЕТА, КУЗНЕЦОВА ЕКАТЕРИНА (рук. Абозина Н.И., Качинская А.А., конц. Шайхисламов Р. Р.) номинация "Фольклорное пение "АНСАМБЛИ": Детский фольклорный ансамбль "ГОРОШИНЫ" (рук. Качинская А.А., конц. Коженок Н.В.) Детский фольклорный ансамбль "СОЛОВУШКИ", младшая группа (рук. Сергейчик А.С., конц. Шайхисламов Р. Р.) СПЕЦИАЛЬНЫМИ ДИПЛОМАМИ жюри отмечены: - трио: Литвинюк Людмила (НДШИ), Литвинюк Валентина (НКИ), Кожанова Людмила (рук. Литвинюк В.Н.) за семейное ансамблевое пение, - вокально-инструментальный ансамбль: Шунц А. А., Шайхисламов Р. Р., Коженок Н.В. (рук. Шайхисламов Р. Р.) Благодарим руководителей творческих коллективов, преподавателей и концертмейстеров за подготовку победителей фестиваля-конкурса! Праздник фольклора завершился, а традиции остаются!	29.03.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2436795	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
104	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	ПРИЗНАНИЕ ТАЛАНТА И ТРУДА	25 марта в Концертном зале школы искусств состоялась праздничная концертная программа, посвящённая Дню работника культуры. Этот праздник объединяет тех, кто наполняет нашу жизнь яркими эмоциями и духовным смыслом. Музыканты и библиотекари, специалисты и художники, методисты и руководители коллективов — все те, кто хранят традиции и создают в обществе новые ориентиры. С днем работника культуры норильчан лично поздравили: Глава города Норильска Д.В. Карасев, заместитель председателя по образованию и культуре Законодательного Собрания Красноярского края И.Н. Субочева, председатель Норильского городского Совета депутатов А. А. Пестряков. В праздничной обстановке прошла церемония награждения работников культуры города. Среди них - четверо сотрудников школы искусств. Благодарственным письмом Министерства культуры края отмечены преподаватели: Екатерина Писарева (хореографическое искусство) и Елена Чернышева (домра), Благодарственным письмом Главы города Норильска награждена преподаватель отделения "Фольклорное искусство" Анна Шунц , Благодарственным письмом Норильского городского Совета депутатов отмечена концертмейстер Елена Беляева. В праздничном концерте приняли участие: Оркестр русских народных инструментов (рук. Р. Р. Шайхисламов), преподаватель А. А. Шунц и фольклорный ансамбль "Соловушки" (рук. А.С. Сергейчик). Поздравляем всех работников культуры Норильска с профессиональным праздником! Спасибо за ваш ежедневный труд, любовь и преданность своему делу! Фото Антона Малышева	25.03.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2433868	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
105	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	В УНИСОН С УСПЕХОМ	С 14 по 15 марта состоялся Международный конкурс молодых исполнителей на струнных инструментах имени М.М. Берлянчика (Магнитогорск). В этом году он посвящён 100-летию со дня рождения музыкального деятеля. Камерный оркестр школы искусств ( рук. В.В. Быкадоров ) стал лауреатом III степени ! Конкурс проводился по четырем номинациям: сольное исполнительство (скрипка, альт, виолончель, контрабас); ансамблевое исполнительство; оркестровое исполнительство; методические работы в пяти возрастных группах. В конкурсе приняли участие 33 солиста, 12 ансамблей и 2 оркестра. Участниками конкурса стали обучающиеся детских школ искусств, студенты музыкальных колледжей и вузов из Красноярского края, Тюменской, Новосибирской, Челябинской областей и других регионов России, а также из Беларуси, Казахстана, Башкортостана. Поздравляем оркестровый коллектив и руководителя и желаем новых творческих достижений!	15.03.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2432342	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
106	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	КОГДА ЗНАНИЯ ПРЕВРАЩАЮТСЯ В НАГРАДЫ	Завершился Межмуниципальный конкурс по музыкально-теоретическим дисциплинам "Надежда Норильска-2026" ! Сегодня в Малом зале школы искусств состоялось награждение победителей! Сольфеджио и музыкальная литература часто считаются самыми сложными дисциплинами, ведь они требуют не только таланта, но и железной дисциплины, острого слуха и эрудиции. Все это старались продемонстрировать наши учащиеся, показав достойные результаты! МУЗЫКАЛЬНАЯ ЛИТЕРАТУРА номинация «Творческий проект»: ГРАН ПРИ – Васильев Илья (преп. Парамонова А.Г.) Лауреат I степени – Семенец Любовь (преп. Парамонова А.Г.) Диплом за участие - Кнышова Алина (преп. Шапилова О.В.) СОЛЬФЕДЖИО ГРАН ПРИ – Семенец Любовь (преп. Парамонова А.Г.) Лауреаты I степени: Булыгина Алина (преп. Парамонова А.Г.) Буряк Артем (преп. Парамонова А.Г.) Лауреаты II степени: Алиев Талыб (преп. Парамонова А.Г.) Зиязова Ясмин (преп. Шапилова О.В.) Бурцев Степан (преп. Парамонова А.Г.) Васильев Илья (преп. Парамонова А.Г.) Лауреаты III степени: Исмаилова Арина (преп. Парамонова А.Г.) Мыльников Тимофей (преп. Шапилова О.В.) Булыгина Алена (преп. Парамонова А.Г.) Дипломанты: Сыркова Елизавета (преп. Парамонова А.Г.) Дипломом за участие отмечены: Щербакова София, Звягинцев Илья, Газетдинов Даниил (преп. Сидорова Е.А.), Матвейченко Полина, Танаева Инесса (преп.Шапилова О.В.), Восколович Карина (преп. Парамонова А.Г.) Поздравляем победителей!!! Благодарим преподавателей за подготовку участников и мотивацию к конкурсным испытаниям!	23.03.2026 10:32	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2431981	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
108	2026-06-23 13:17:55.030033	2026-06-23 13:19:33.344764	2026-06-23 13:19:33.496774	nordshi_afisha	Норильская детская школа искусств (Афиша)	МОГУЩЕСТВО ТЕОРИИ	21 марта , стартовал большой конкурс по музыкально-теоретическим дисциплинам "Надежда Норильска" ! Учредитель конкурса - Управление по делам культуры и искусства Администрации города Норильска. Его участниками стали более 70 юных и молодых музыкантов - учащихся образовательных учреждений культуры города и студентов Норильского колледжа искусств. Жюри конкурса возглавила Корнева Ирина Александровна - заслуженный работник культуры Красноярского края, заместитель директора по учебно-воспитательной работе Красноярского колледжа искусств имени П.И. Иванова - Радкевича. В первый день состоялись конкурсные испытания: по сольфеджио (для учащихся 3, 5, 6, 9 классов и студентов НКИ); по музыкальной литературе: в номинациях "Эрудит" и "Творческий проект". Обе номинации посвящены наследию двух юбиляров 2026 года: В. А. Моцарта и С.С. Прокофьева. Желаем участникам успешного выступления, точных ответов и уверенности в своих силах!	21.03.2026	\N	Норильск	\N	\N	Норильская детская школа искусств	\N	https://nordshi.ru/item/2431234	news	processed	2026-06-23 13:19:33.496774	\N	http://localhost:9000/afisha-images/events/main/37990dbbc5bfe9fa003db49731582f39593fcf5e7740c152490881f3afe1c50b.jpg	http://localhost:9000/afisha-images/picture1.png	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, created_at, update_at, deleted_at, user_id, role) FROM stdin;
1	2026-06-23 13:07:13.498423	2026-06-23 13:07:13.498423	\N	1	user
2	2026-06-23 13:16:19.001383	2026-06-23 13:16:29.114264	\N	2	admin
\.


--
-- Data for Name: times_event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.times_event (id, event_id, date_event, start_time) FROM stdin;
1	1	2026-06-24 15:00:00	15:00:00
2	2	2026-06-27 18:00:00	18:00:00
3	3	2026-06-22 08:00:00	08:00:00
4	4	2026-06-14 18:00:00	18:00:00
5	6	2026-06-12 11:00:00	11:00:00
6	8	2026-06-14 18:00:00	18:00:00
7	10	2026-06-12 14:00:00	14:00:00
8	11	2026-06-12 12:00:00	12:00:00
9	12	2026-05-31 13:00:00	13:00:00
10	13	2026-05-23 14:00:00	14:00:00
11	15	2026-04-18 15:00:00	15:00:00
12	18	2024-12-12 09:19:00	09:19:00
13	19	2026-12-21 09:00:00	09:00:00
14	20	2026-11-23 13:00:00	13:00:00
15	21	2024-10-30 05:45:00	05:45:00
16	21	2024-10-30 18:00:00	18:00:00
17	22	2026-10-19 17:00:00	17:00:00
18	23	2024-04-18 08:00:00	08:00:00
19	24	2026-04-15 09:00:00	09:00:00
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."user" (id, created_at, update_at, deleted_at, username, password_hash, preferences, refresh_token, email, is_org, date_of_birth, like_events) FROM stdin;
1	2025-09-12 08:08:00.245857	2025-09-12 08:08:00.245857	\N	zaharovila780@gmail.com	5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5	{}	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjAyNTY0ODAsImp0aSI6IjNlNmRmYTg3LTRiNjctNGFkNC05MjU1LWM1ZTA1YmMzYTgxMSIsInVzZXJfaWQiOjF9.Okqkpb0s0jkFdHOr6Tkjy4kaWtRs6wOZM4mHLzOvXwc	zaharovila780@gmail.com	\N	2004-04-07	{}
2	2026-06-02 11:50:15.496972	2026-06-02 18:51:23.517384	\N	dffdgfd	78872b9d3e7fd2883acb87ef3e8aa01c6ea06d03237bde05da41fec46122ee66	{7,6,5}	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODI5OTMwMTUsImp0aSI6ImFlYzNhNjIyLTc1NjUtNDNkNC05MTY5LTlhMmY1M2VmYmY2MSIsInVzZXJfaWQiOjJ9.W2y0-4BnSmyAh7b1vlJb130N4xnMhf7exHwGS5NVxpo	zaharovila780@gmail.com	\N	2000-12-12	{}
3	2026-06-05 10:43:44.839576	2026-06-05 16:03:09.483582	\N	Np1r54536	5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5	{1}	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODMyNDgyMjQsImp0aSI6ImMyYTFjNGJlLTc2YmMtNDk4Ny1hMDAxLWZjODU4OTFkOWMwNCIsInVzZXJfaWQiOjN9.TguNnCPCwYsLAgGf0fyrEnb7KvwXysZ1z4w0T2PlyiU	zaharovila7801@gmail.com	\N	2004-04-07	{2}
\.


--
-- Data for Name: user_groups_event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_groups_event (user_id, groups_id) FROM stdin;
1	1
1	3
1	5
1	7
2	1
2	2
2	3
\.


--
-- Data for Name: user_to_event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_to_event (user_id, event_id, created_at, update_at, deleted_at) FROM stdin;
1	2	2026-06-23 13:28:37.676785	2026-06-23 13:28:37.676785	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, created_at, update_at, deleted_at, username, password_hash, email, date_of_birth, refresh_token) FROM stdin;
1	2026-06-23 13:07:13.498423	2026-06-23 20:14:17.228449	\N	ilia1	5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5	ilia@ilia.com	2004-04-07	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODQ4MTIwMzMsImp0aSI6IjQ5NDk5NmZmLTdiM2QtNDU0Yy1iMmUxLTZhYWI4YjNlZjU3OCIsInVzZXJfaWQiOjF9.JywPDnH43I285T5GvdJzl28UQCiGimfPNpELbr14RBM
2	2026-06-23 13:16:19.001383	2026-06-23 13:16:29.114264	\N	admin	8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918	admin@admin.com	2007-07-07	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODQ4MTI1NzksImp0aSI6IjBjYzY5YmRiLWY1NzAtNDAyOC1hMzBhLTAyMmIyMzBiNjExNSIsInVzZXJfaWQiOjJ9.1VWLj4QwMePGGQcBb1nABObRj8QpOvMfjQrdkpA4a6c
\.


--
-- Name: event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_id_seq', 2, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.events_id_seq', 24, true);


--
-- Name: group_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_event_id_seq', 1, true);


--
-- Name: groups_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.groups_event_id_seq', 9, true);


--
-- Name: info_org_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.info_org_id_seq', 1, false);


--
-- Name: info_organization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.info_organization_id_seq', 6, true);


--
-- Name: news_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_id_seq', 27, true);


--
-- Name: organizer_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.organizer_applications_id_seq', 1, false);


--
-- Name: parsed_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.parsed_event_id_seq', 108, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 2, true);


--
-- Name: times_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.times_event_id_seq', 19, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: event_groups_event event_groups_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_groups_event
    ADD CONSTRAINT event_groups_event_pkey PRIMARY KEY (event_id, groups_id);


--
-- Name: event event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: group_event group_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_event
    ADD CONSTRAINT group_event_pkey PRIMARY KEY (id);


--
-- Name: groups_event groups_event_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups_event
    ADD CONSTRAINT groups_event_name_key UNIQUE (name);


--
-- Name: groups_event groups_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups_event
    ADD CONSTRAINT groups_event_pkey PRIMARY KEY (id);


--
-- Name: info_org info_org_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.info_org
    ADD CONSTRAINT info_org_pkey PRIMARY KEY (id);


--
-- Name: info_organization info_organization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.info_organization
    ADD CONSTRAINT info_organization_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: organizer_applications organizer_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_applications
    ADD CONSTRAINT organizer_applications_pkey PRIMARY KEY (id);


--
-- Name: organizer_applications organizer_applications_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_applications
    ADD CONSTRAINT organizer_applications_user_id_key UNIQUE (user_id);


--
-- Name: parsed_event parsed_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parsed_event
    ADD CONSTRAINT parsed_event_pkey PRIMARY KEY (id);


--
-- Name: parsed_event parsed_event_source_name_date_start_time_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parsed_event
    ADD CONSTRAINT parsed_event_source_name_date_start_time_key UNIQUE (source_key, name, date_event, start_time);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_user_id_key UNIQUE (user_id);


--
-- Name: times_event times_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.times_event
    ADD CONSTRAINT times_event_pkey PRIMARY KEY (id);


--
-- Name: user_groups_event user_groups_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups_event
    ADD CONSTRAINT user_groups_event_pkey PRIMARY KEY (user_id, groups_id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: user_to_event user_to_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_to_event
    ADD CONSTRAINT user_to_event_pkey PRIMARY KEY (user_id, event_id);


--
-- Name: user user_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_username_key UNIQUE (username);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: event event_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.group_event(id);


--
-- Name: event_groups_event event_groups_event_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_groups_event
    ADD CONSTRAINT event_groups_event_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: event_groups_event event_groups_event_groups_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_groups_event
    ADD CONSTRAINT event_groups_event_groups_id_fkey FOREIGN KEY (groups_id) REFERENCES public.groups_event(id);


--
-- Name: events events_organization_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_organization_fkey FOREIGN KEY (organization) REFERENCES public.info_organization(id);


--
-- Name: info_org info_org_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.info_org
    ADD CONSTRAINT info_org_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: news news_organization_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_organization_fkey FOREIGN KEY (organization) REFERENCES public.info_organization(id);


--
-- Name: organizer_applications organizer_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_applications
    ADD CONSTRAINT organizer_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: organizer_applications organizer_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_applications
    ADD CONSTRAINT organizer_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: roles roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: times_event times_event_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.times_event
    ADD CONSTRAINT times_event_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: user_groups_event user_groups_event_groups_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups_event
    ADD CONSTRAINT user_groups_event_groups_id_fkey FOREIGN KEY (groups_id) REFERENCES public.groups_event(id);


--
-- Name: user_groups_event user_groups_event_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups_event
    ADD CONSTRAINT user_groups_event_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_to_event user_to_event_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_to_event
    ADD CONSTRAINT user_to_event_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: user_to_event user_to_event_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_to_event
    ADD CONSTRAINT user_to_event_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

