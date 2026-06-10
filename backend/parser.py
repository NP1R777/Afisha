import requests
import psycopg2
from bs4 import BeautifulSoup
from datetime import datetime

DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'performs'
DB_USER = 'postgres'
DB_PASSWORD = '123456'

months = {
    "января": "01", "февраля": "02", "марта": "03",
    "апреля": "04", "мая": "05", "июня": "06",
    "июля": "07", "августа": "08", "сентября": "09",
    "октября": "10", "ноября": "11", "декабря": "12"
}

def create_table():
    connection = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = connection.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS performances (
        id SERIAL PRIMARY KEY,
        date DATE,
        title TEXT,
        link TEXT,
        time TEXT,
        price TEXT,
        age_limit TEXT,
        image_url TEXT,
        location TEXT,
        organizer TEXT,
        city TEXT,
        approved bool           
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS pars (
        date DATE,
        time VARCHAR
    );
    ''')

    connection.commit()
    cursor.close()
    connection.close()

def insert_performance(performance):
    connection = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = connection.cursor()

    cursor.execute('''
    INSERT INTO performances (date, title, link, time, price, age_limit, image_url, location, organizer, city, approved)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    ''', (performance['date'], performance['title'], performance['link'],
          performance['time'], performance['price'], performance['age_limit'],
          performance['image_url'], performance['location'], performance['organizer'], performance['city'], performance['approved']))

    connection.commit()
    cursor.close()
    connection.close()

def insert_run_details():
    connection = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = connection.cursor()

    current_run_date = datetime.now().date()
    current_run_time = datetime.now().strftime("%H:%M:%S")

    cursor.execute('''
    INSERT INTO pars (date, time)
    VALUES (%s, %s);
    ''', (current_run_date, current_run_time))
    connection.commit()
    cursor.close()
    connection.close()

def clear_performances():
    connection = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = connection.cursor()

    cursor.execute('DELETE FROM performances;')

    connection.commit()
    cursor.close()
    connection.close()

def parse_afisha(url):
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Ошибка при получении страницы: {response.status_code}")
        return

    soup = BeautifulSoup(response.content, 'html.parser')
    performances = soup.find_all('li', class_='performances-timelist__item')
    performance_list = []

    current_year = datetime.now().year

    clear_performances()

    for performance in performances:
        date_element = performance.find('div', class_='performances-timelist__date')
        day = date_element.find('div', class_='performances-timelist__day').text.strip()
        month = date_element.find('div', class_='performances-timelist__month').text.strip()
        full_date = f"{day} {month}"

        if month in months:
            month_number = months[month]
            formatted_date = datetime.strptime(f"{day} {month_number} {current_year}", "%d %m %Y").date()
            formatted_date_str = formatted_date.strftime("%Y-%m-%d")
        else:
            print(f"Незнакомый месяц: {month}")
            continue

        events = performance.find_all('li', class_='performances__item')

        for event in events:
            title_element = event.find('a', class_='performances__title')
            title = title_element.text.strip()
            link = title_element.get('href')
            time_element = event.find('div', class_='performances__time')
            time = time_element.text.strip() if time_element else 'Не указано'
            price_element = event.find('div', class_='performances__price')
            price = price_element.text.strip() if price_element else 'Не указано'
            age_limit_element = event.find('div', class_='mark')
            age_limit = age_limit_element.text.strip() if age_limit_element else 'Нет информации'
            image_element = event.find('img', class_='performances__img')
            image_url = image_element.get('src') if image_element else 'Нет изображения'

            city = 'Талнах' if '[Талнах]' in title else 'Норильск'
            location = 'ул Строителей 17' if '[Талнах]' in title else 'Ленинский проспект 34'

            performance_info = {
                'date': formatted_date_str,
                'title': title,
                'link': link,
                'time': time,
                'price': price,
                'age_limit': age_limit,
                'image_url': image_url,
                'location': location,
                'organizer': 'Анна Бабанова',
                'city': city,
                'approved': True
            }
            performance_list.append(performance_info)

            insert_performance(performance_info)

    return performance_list

if __name__ == "__main__":
    create_table()
    insert_run_details()  
    performances = parse_afisha("https://www.northdrama.ru/afisha?month=2")