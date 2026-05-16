/*
  API-клиент проекта.
  Здесь собраны:
  - список доступных API ресурсов;
  - поля для форм;
  - функция apiRequest для fetch-запросов.
*/

const STORAGE_KEY = 'thefrontend_api_example_config';
const DEFAULT_API_BASE = 'https://front.bilimai.kg/api';

const resources = {
  clients: {
    title: 'Clients',
    actions: {
      list: { label: 'Получить клиентов', method: 'GET', path: '/personal' },
    },
    fields: [],
    demo: {},
  },

  category: {
    title: 'Category',
    actions: {
      list: { label: 'Получить категории', method: 'GET', path: '/category' },
      tree: { label: 'Получить дерево категорий', method: 'GET', path: '/category/parent' },
      show: { label: 'Получить одну категорию', method: 'GET', path: '/category/{id}', needsId: true },
      create: { label: 'Создать категорию', method: 'POST', path: '/category' },
      update: { label: 'Изменить категорию', method: 'PUT', path: '/category/{id}', needsId: true },
      status: { label: 'Изменить статус', method: 'PATCH', path: '/category/{id}', needsId: true, bodyOnly: ['status'] },
      delete: { label: 'Удалить категорию', method: 'DELETE', path: '/category/{id}', needsId: true },
    },
    fields: [
      { name: 'title', label: 'title', type: 'text', requiredFor: ['create'], placeholder: 'Новости' },
      { name: 'title_en', label: 'title_en', type: 'text', requiredFor: ['create'], placeholder: 'News' },
      { name: 'description', label: 'description', type: 'text', requiredFor: ['create'], placeholder: 'Раздел новостей' },
      { name: 'description_en', label: 'description_en', type: 'text', requiredFor: ['create'], placeholder: 'News section' },
      { name: 'image', label: 'image', type: 'url', requiredFor: ['create'], placeholder: 'https://example.com/category.jpg' },
      { name: 'parent_id', label: 'parent_id', type: 'number', placeholder: 'Можно оставить пустым' },
      { name: 'status', label: 'status', type: 'select', options: ['true', 'false'], onlyFor: ['status'] },
    ],
    demo: {
      title: 'Новости',
      title_en: 'News',
      description: 'Раздел новостей',
      description_en: 'News section',
      image: 'https://example.com/category.jpg',
      parent_id: '',
      status: 'true',
    },
  },

  post: {
    title: 'Post',
    actions: {
      list: { label: 'Получить посты', method: 'GET', path: '/post' },
      show: { label: 'Получить пост', method: 'GET', path: '/post/{id}', needsId: true },
      withComments: { label: 'Пост с комментариями', method: 'GET', path: '/post/comment/{id}', needsId: true },
      create: { label: 'Создать пост', method: 'POST', path: '/post' },
      update: { label: 'Изменить пост', method: 'PUT', path: '/post/{id}', needsId: true },
      publish: { label: 'Опубликовать/скрыть', method: 'PATCH', path: '/post/{id}', needsId: true, bodyOnly: ['is_published'] },
      delete: { label: 'Удалить пост', method: 'DELETE', path: '/post/{id}', needsId: true },
    },
    fields: [
      { name: 'category_id', label: 'category_id', type: 'number', requiredFor: ['create'], placeholder: '12' },
      { name: 'title', label: 'title', type: 'text', requiredFor: ['create'], placeholder: 'Первый пост' },
      { name: 'title_en', label: 'title_en', type: 'text', requiredFor: ['create'], placeholder: 'First post' },
      { name: 'description', label: 'description', type: 'text', requiredFor: ['create'], placeholder: 'Короткое описание' },
      { name: 'description_en', label: 'description_en', type: 'text', requiredFor: ['create'], placeholder: 'Short description' },
      { name: 'image', label: 'image', type: 'url', requiredFor: ['create'], placeholder: 'https://example.com/post.jpg' },
      { name: 'image_en', label: 'image_en', type: 'url', requiredFor: ['create'], placeholder: 'https://example.com/post-en.jpg' },
      { name: 'client_id', label: 'client_id', type: 'number', placeholder: 'Можно оставить пустым' },
      { name: 'is_published', label: 'is_published', type: 'select', options: ['true', 'false'], onlyFor: ['publish'] },
    ],
    demo: {
      category_id: '12',
      title: 'Первый пост',
      title_en: 'First post',
      description: 'Короткое описание',
      description_en: 'Short description',
      image: 'https://example.com/post.jpg',
      image_en: 'https://example.com/post-en.jpg',
      client_id: '',
      is_published: 'true',
    },
  },

  comment: {
    title: 'Comment',
    actions: {
      list: { label: 'Получить комментарии', method: 'GET', path: '/comment?post_id={post_id}', needsPostId: true },
      create: { label: 'Создать комментарий', method: 'POST', path: '/comment' },
      update: { label: 'Изменить комментарий', method: 'PUT', path: '/comment/{id}', needsId: true },
      delete: { label: 'Удалить комментарий', method: 'DELETE', path: '/comment/{id}', needsId: true },
    },
    fields: [
      { name: 'post_id', label: 'post_id', type: 'number', requiredFor: ['list', 'create'], placeholder: '34' },
      { name: 'comment', label: 'comment', type: 'text', requiredFor: ['create'], placeholder: 'Отличный материал' },
      { name: 'comment_en', label: 'comment_en', type: 'text', requiredFor: ['create'], placeholder: 'Great article' },
      { name: 'parent_id', label: 'parent_id', type: 'number', placeholder: 'Можно оставить пустым' },
    ],
    demo: {
      post_id: '34',
      comment: 'Отличный материал',
      comment_en: 'Great article',
      parent_id: '',
    },
  },
};

function loadConfig() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return {
      apiBase: DEFAULT_API_BASE,
      token: '',
    };
  }

  return JSON.parse(saved);
}

function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

function normalizeValue(value, field) {
  if (value === '') {
    return null;
  }

  if (field.type === 'number') {
    return Number(value);
  }

  if (field.type === 'select' && (value === 'true' || value === 'false')) {
    return value === 'true';
  }

  return value;
}

async function apiRequest(path, { method = 'GET', body } = {}) {
  const config = loadConfig();

  if (!config.apiBase || !config.token) {
    throw new Error('Сначала заполните API Base URL и token.');
  }

  const url = new URL(config.apiBase + path);
  url.searchParams.set('token', config.token);

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const details = data?.errors
      ? Object.entries(data.errors).map(([field, messages]) => `${field}: ${messages.join(', ')}`).join('\n')
      : '';

    throw new Error([data?.message || data?.error || `HTTP ${response.status}`, details].filter(Boolean).join('\n'));
  }

  return data;
}
