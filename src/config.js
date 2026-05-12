let config = {
    baseUrl: ''
};

export const loadConfig = async () => {
    try {
        const response = await fetch('/service-gateway/configuration.json');
        const configData = await response.json();
        config = { ...config, ...configData };
        return config;
    } catch (error) {
        console.error('Failed to load configuration:', error);
        return config;
    }
};

export const getConfig = () => config;
