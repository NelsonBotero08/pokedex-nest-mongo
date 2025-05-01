

export const EnvConfiguration = () => ({
    environment: process.env.NOSE_ENV || 'dev',
    mongodb: process.env.MONGODB,
    port: +process.env.PORT! || 3002,
    defaultLimit: +process.env.DEFAULT_LIMIT! || 7,
})