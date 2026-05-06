**hii plz readme!!!** 
don't forget to render with ctrl shift v

## for users
first create a .env file, then copy .env.example's text into .env file 

run docker desktop 

then in terminal write `docker compose up -d`  which will be enough to run the app, then check 

it will start running in localhost:3000 if u don't change anything

if u alr have applications running in the ports, it won't work. Check the env files to see which ports are being used 

## for developers

`docker compose down -v`

if u don't know what ur going to do check designdecisions n projectsummary markdown files

also we use phpmyadmin for database, and docker auto imports sql files 

btw start with ejs with minimal css, we will implement the features first then we will work on how it looks.

## architecture
*blank*
mysql8, phpmyadmin, express, dotenv, ejs

**division of labor:**

alya: /shoppingcart (ejs + route)

zeynep: /products page(ejs + route)

alp: sql, docker, .md's, /login n /signup 