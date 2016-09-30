# სიტყვების თამაში 
Master v.2.0.0 (alpha)

gh-pages v.1.x [Demo](https://georgegach.github.io/wordgame/)
***

## განახლება #2
##### ტექნოლოგიები
- HTML - CSS - Javascript (RequireJS) - PHP (Slim) - MySQL - NodeJS (Socket.io)

##### შესაძლებლობები
- Online Mode
- ჩეთი

***

## განახლება #1
##### ტექნოლოგიები
- HTML - CSS - Javascript

##### შესაძლებლობები
- Offline Normal და Infinite Mode-ები
- ლიდერბორდი
- საუკეთესო სიტყვები
- ანიმაციები და ფერებით კოდირებული მოთამაშეები


***
### ინსტრუქცია
1) [Composer](https://getcomposer.org/download/)-ის საშუალებით გადმოწერეთ  აპლიკაციის დამოკიდებულებები  
```bash
php composer install
```
2) გაუშვით API საქაღალდის შიგთავსი Apache სერვერზე (არაა აუცილებელი ამ საქაღალდეში დატოვოთ)

3) დააიმპორთეთ DB საქაღალდეში მოქცეული მონაცემთა ბაზის [დამპი](https://github.com/georgegach/wordgame/raw/master/DB/game.sql) (იხ. დიაგრამა ქვემოთ)
```bash
mysql db_name < game.sql
```
4) გადმოწერეთ [NodeJS](https://nodejs.org/en/download/) დამოკიდებულებები და გაუშვით მთავარი სერვერი
```bash
npm install
node server.js
```

### სქრინშოტი (ონლაინ თამაში)
![alt text](https://github.com/georgegach/wordgame/raw/master/docs/screen.png)



