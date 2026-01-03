# 🔧 Настройка MongoDB Atlas для FindBuild

## ⚠️ Важно: Сначала завершите шаг 1!

Вы видите красный баннер: **"You can't connect yet. Set up your user security permission in the first step."**

Это значит, что нужно вернуться к **шагу 1** и создать пользователя базы данных.

---

## 📋 Пошаговая инструкция:

### Шаг 1: Настройка безопасности (Security Setup)

1. **Нажмите "Go Back"** или вернитесь к шагу 1
2. **Создайте пользователя базы данных:**
   - Username: `findbuild-user` (или любое имя)
   - Password: создайте надежный пароль (сохраните его!)
   - Database User Privileges: `Atlas admin` или `Read and write to any database`
3. **Настройте Network Access:**
   - Добавьте IP адрес: `0.0.0.0/0` (разрешить доступ откуда угодно)
   - Или добавьте ваш текущий IP адрес

### Шаг 2: Получение Connection String

После завершения шага 1:

1. Вернитесь к **шагу 2: "Choose a connection method"**
2. Нажмите на **"Drivers"** (иконка с 1011/1011)
3. Выберите **"Node.js"** и версию **"5.5 or later"**
4. Скопируйте connection string, он будет выглядеть так:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Шаг 3: Замена в connection string

Замените в скопированной строке:
- `<username>` → ваш username (например, `findbuild-user`)
- `<password>` → ваш пароль
- Добавьте имя базы данных в конце: `&appName=findbuild` или `/findbuild?retryWrites=true&w=majority`

**Итоговый пример:**
```
mongodb+srv://findbuild-user:ваш-пароль@cluster0.xxxxx.mongodb.net/findbuild?retryWrites=true&w=majority
```

### Шаг 4: Добавление в проект

1. Создайте файл `.env.local` в корне проекта (если его еще нет)
2. Добавьте строку:
   ```env
   MONGODB_URI=mongodb+srv://findbuild-user:ваш-пароль@cluster0.xxxxx.mongodb.net/findbuild?retryWrites=true&w=majority
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=ваш-секретный-ключ
   ```

3. **Важно:** Замените `ваш-пароль` на реальный пароль, который вы создали!

---

## 🔐 Генерация NEXTAUTH_SECRET

В PowerShell выполните:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Скопируйте результат и вставьте в `.env.local`

---

## ✅ Проверка подключения

После настройки `.env.local`:

1. Перезапустите dev сервер (если он запущен):
   ```bash
   # Остановите сервер (Ctrl+C)
   npm run dev
   ```

2. Проект автоматически подключится к MongoDB при первом использовании

---

## 🆘 Если что-то не работает:

### Проблема: "Authentication failed"
- Проверьте username и password в connection string
- Убедитесь, что пользователь создан в шаге 1

### Проблема: "Network timeout"
- Проверьте Network Access в MongoDB Atlas
- Убедитесь, что ваш IP добавлен или используется `0.0.0.0/0`

### Проблема: "Database not found"
- Это нормально! База данных создастся автоматически при первом подключении
- Или создайте базу данных вручную через MongoDB Compass

---

## 💡 Альтернатива: Локальный MongoDB

Если не хотите использовать Atlas, можете установить MongoDB локально:

1. Скачайте MongoDB Community Server
2. Установите и запустите
3. Используйте в `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/findbuild
   ```

---

## 📝 Примечание

**Проект работает БЕЗ MongoDB!** 
- Placeholder данные работают без базы данных
- MongoDB нужен только для реального хранения данных
- Вы можете сначала протестировать проект, а потом настроить MongoDB

---

**Удачи с настройкой! 🚀**




