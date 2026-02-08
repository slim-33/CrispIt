# MongoDB Setup Guide for Crispit

This guide explains how to set up MongoDB for the Crispit app using a simple MongoDB URI connection.

## Quick Setup

1. **Create a MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account
   - Create a new cluster (free tier is sufficient)

2. **Get Your Connection String**
   - In your MongoDB Atlas dashboard, click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

3. **Configure Your App**
   - Open the `.env` file in your project
   - Update the `MONGODB_URI` with your connection string:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crispitdb
     ```
   - Replace `username` and `password` with your database credentials
   - The database name `crispitdb` will be automatically created

## Detailed Steps

### 1. Create a MongoDB Atlas Cluster

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click "Create a New Cluster"
4. Choose the free tier (M0)
5. Select your preferred cloud provider and region
6. Click "Create Cluster"

### 2. Create a Database User

1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username and strong password (save these!)
5. Under "Database User Privileges", select "Read and write to any database"
6. Click "Add User"

### 3. Configure Network Access

1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add only your specific IP addresses
5. Click "Confirm"

### 4. Get Your Connection String

1. Go back to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as the driver
5. Copy the connection string
6. It will look like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`

### 5. Update Your .env File

Replace the placeholder in your `.env` file:

```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/crispitdb
```

**Important:**
- Replace `your_username` with your database username
- Replace `your_password` with your database password
- Keep `crispitdb` as the database name (or change to your preference)
- Make sure there are no spaces in the URI

## Testing Your Connection

After updating your `.env` file:

1. Install dependencies: `npm install`
2. Start your app: `npm start`
3. The app will automatically connect to MongoDB on first data operation
4. Check the console for "MongoDB connected successfully"

## Troubleshooting

### Connection Failed
- **Check your credentials**: Ensure username and password are correct
- **Network access**: Verify your IP is whitelisted in MongoDB Atlas
- **URI format**: Make sure the URI is properly formatted with no extra spaces

### Authentication Error
- Ensure the database user has "Read and write to any database" permissions
- Double-check the username and password in the connection string

### Database Not Found
- The database will be created automatically on first write operation
- No need to manually create the database in MongoDB Atlas

## Collections

The app automatically creates these collections:
- `pokedex` - Discovered produce items
- `fridge` - Current fridge inventory
- `stats` - Global usage statistics
- `chat` - Chat history

## Security Best Practices

1. **Never commit your .env file** - It contains sensitive credentials
2. **Use strong passwords** - For your database users
3. **Restrict IP access** - In production, only allow specific IPs
4. **Rotate credentials** - Change passwords periodically
5. **Monitor usage** - Check MongoDB Atlas dashboard regularly

## What Changed from v6

In v7, we simplified MongoDB configuration to use a single URI instead of multiple separate values:

**Before (v6):**
```env
MONGODB_API_KEY=your_api_key
MONGODB_CLUSTER_URL=https://data.mongodb-api.com/...
MONGODB_DATABASE=crispitdb
```

**After (v7):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crispitdb
```

This is simpler, more standard, and works with all MongoDB drivers and tools.

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html)
