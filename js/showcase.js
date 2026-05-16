/*
  Реальная витрина продукта.
  Логика сделана как в обычном сайте:
  - выбрали категорию -> появилась форма добавления поста в эту категорию;
  - выбрали пост -> появилась форма комментария;
  - выбранный пост можно изменить или удалить.
*/

const demoCategories = [
  {
    id: 1,
    title: 'Frontend',
    title_en: 'Frontend',
    description: 'UI, JavaScript and product interfaces',
    description_en: 'UI, JavaScript and product interfaces',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900',
  },
  {
    id: 2,
    title: 'Education',
    title_en: 'Education',
    description: 'Guides, lessons and learning paths',
    description_en: 'Guides, lessons and learning paths',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900',
  },
  {
    id: 3,
    title: 'Startup',
    title_en: 'Startup',
    description: 'Ideas, launches and product thinking',
    description_en: 'Ideas, launches and product thinking',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900',
  },
];

const demoPosts = [
  {
    id: 101,
    category_id: 1,
    title: 'Как собрать красивый API-каталог',
    title_en: 'Build a beautiful API catalog',
    description: 'Практический пример публичной страницы с категориями, карточками и комментариями.',
    description_en: 'A practical example with categories, cards and comments.',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200',
    image_en: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200',
  },
  {
    id: 102,
    category_id: 2,
    title: 'Учебная платформа на простом API',
    title_en: 'Learning platform on a simple API',
    description: 'Покажите уроки, разделы и обсуждения без сложной админки.',
    description_en: 'Show lessons, sections and discussions without a complex admin.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200',
    image_en: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200',
  },
  {
    id: 103,
    category_id: 3,
    title: 'Новостной портал за один день',
    title_en: 'News portal in one day',
    description: 'Статический frontend может стать полноценным сайтом, если данные приходят из API.',
    description_en: 'A static frontend can become a full website when data comes from an API.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
    image_en: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
  },
];

const demoComments = [
  { id: 1, post_id: 101, comment: 'Очень понятный пример, можно сразу адаптировать.', comment_en: 'Very clear example.' },
  { id: 2, post_id: 101, comment: 'Такой формат отлично подходит для GitHub Pages.', comment_en: 'Great for GitHub Pages.' },
];

let showcaseState = {
  categories: [...demoCategories],
  posts: [...demoPosts],
  comments: [...demoComments],
  selectedCategoryId: demoCategories[0].id,
  selectedPostId: demoPosts[0].id,
  demoMode: true,
};

function showcaseConfigReady() {
  const config = loadConfig();
  return config.apiBase && config.token;
}

function setShowcaseStatus(message, type = 'info') {
  const status = document.getElementById('showcaseStatus');
  if (!status) return;
  status.textContent = message;
  status.className = `showcase-status ${type}`;
}

function escapeShowcaseHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function categoryTitle(category) {
  return category?.title || category?.title_en || `Category ${category?.id}`;
}

function postTitle(post) {
  return post?.title || post?.title_en || `Post ${post?.id}`;
}

function postDescription(post) {
  return post?.description || post?.description_en || 'Описание пока не заполнено.';
}

function postImage(post) {
  return post?.image || post?.image_en || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200';
}

function selectedCategory() {
  return showcaseState.categories.find((category) => Number(category.id) === Number(showcaseState.selectedCategoryId));
}

function selectedPost() {
  return showcaseState.posts.find((post) => Number(post.id) === Number(showcaseState.selectedPostId));
}

function postsForSelectedCategory() {
  if (!showcaseState.selectedCategoryId) {
    return showcaseState.posts;
  }

  return showcaseState.posts.filter((post) => Number(post.category_id) === Number(showcaseState.selectedCategoryId));
}

async function loadShowcaseData() {
  if (!showcaseConfigReady()) {
    showcaseState.demoMode = true;
    showcaseState.categories = [...demoCategories];
    showcaseState.posts = [...demoPosts];
    ensureSelection();
    showcaseState.comments = demoComments.filter((comment) => Number(comment.post_id) === Number(showcaseState.selectedPostId));
    setShowcaseStatus('Показаны демо-данные. Формы работают локально для демонстрации. Для реального сохранения введите API Base URL и token на странице «Панель».', 'info');
    renderShowcase();
    return;
  }

  try {
    showcaseState.demoMode = false;
    setShowcaseStatus('Загружаем реальные данные из API...', 'info');

    const [categories, posts] = await Promise.all([
      apiRequest('/category'),
      apiRequest('/post'),
    ]);

    showcaseState.categories = Array.isArray(categories) ? categories : [];
    showcaseState.posts = Array.isArray(posts) ? posts : [];
    ensureSelection();
    await loadShowcaseComments(showcaseState.selectedPostId, false);
    setShowcaseStatus('Загружены реальные данные из вашего API.', 'success');
    renderShowcase();
  } catch (error) {
    showcaseState.demoMode = true;
    showcaseState.categories = [...demoCategories];
    showcaseState.posts = [...demoPosts];
    ensureSelection();
    showcaseState.comments = demoComments.filter((comment) => Number(comment.post_id) === Number(showcaseState.selectedPostId));
    setShowcaseStatus(`API пока не ответил, поэтому показаны демо-данные. ${error.message}`, 'error');
    renderShowcase();
  }
}

async function loadShowcaseComments(postId, shouldRender = true) {
  if (!postId) {
    showcaseState.comments = [];
    if (shouldRender) renderShowcase();
    return;
  }

  if (showcaseState.demoMode || !showcaseConfigReady()) {
    showcaseState.comments = demoComments.filter((comment) => Number(comment.post_id) === Number(postId));
    if (shouldRender) renderShowcase();
    return;
  }

  try {
    const comments = await apiRequest(`/comment?post_id=${postId}`);
    showcaseState.comments = Array.isArray(comments) ? comments : [];
  } catch (error) {
    showcaseState.comments = [];
    setShowcaseStatus(`Пост выбран, но комментарии получить не удалось. ${error.message}`, 'error');
  }

  if (shouldRender) renderShowcase();
}

function ensureSelection() {
  if (!showcaseState.categories.some((category) => Number(category.id) === Number(showcaseState.selectedCategoryId))) {
    showcaseState.selectedCategoryId = showcaseState.categories[0]?.id || null;
  }

  const categoryPosts = postsForSelectedCategory();
  if (!categoryPosts.some((post) => Number(post.id) === Number(showcaseState.selectedPostId))) {
    showcaseState.selectedPostId = categoryPosts[0]?.id || showcaseState.posts[0]?.id || null;
  }
}

function renderCategories() {
  const box = document.getElementById('showcaseCategories');
  if (!box) return;

  box.innerHTML = showcaseState.categories.map((category) => `
    <button class="showcase-category ${Number(category.id) === Number(showcaseState.selectedCategoryId) ? 'selected' : ''}" type="button" data-category-id="${category.id}">
      <span>${escapeShowcaseHtml(categoryTitle(category))}</span>
      <small>${escapeShowcaseHtml(category.description || category.description_en || 'Раздел проекта')}</small>
    </button>
  `).join('');

  document.querySelectorAll('.showcase-category').forEach((button) => {
    button.addEventListener('click', async () => {
      showcaseState.selectedCategoryId = Number(button.dataset.categoryId);
      const firstPost = postsForSelectedCategory()[0];
      showcaseState.selectedPostId = firstPost?.id || null;
      await loadShowcaseComments(showcaseState.selectedPostId);
      renderShowcase();
    });
  });
}

function renderPostCreateForm() {
  const form = document.getElementById('postCreateForm');
  const placeholder = document.getElementById('postCreatePlaceholder');
  const title = document.getElementById('postCreateTitle');
  const badge = document.getElementById('selectedCategoryBadge');
  const category = selectedCategory();

  if (!form || !placeholder || !title || !badge) return;

  if (!category) {
    form.classList.add('hidden');
    placeholder.classList.remove('hidden');
    return;
  }

  form.classList.remove('hidden');
  placeholder.classList.add('hidden');
  title.textContent = `Добавить пост в «${categoryTitle(category)}»`;
  badge.textContent = `category_id: ${category.id}`;
}

function renderPosts() {
  const box = document.getElementById('showcasePosts');
  if (!box) return;

  const posts = postsForSelectedCategory();

  if (!posts.length) {
    box.innerHTML = '<div class="context-empty">В этой категории пока нет постов. Добавьте первый пост через форму выше.</div>';
    return;
  }

  box.innerHTML = posts.map((post) => `
    <article class="showcase-post-card ${Number(post.id) === Number(showcaseState.selectedPostId) ? 'selected' : ''}" data-post-id="${post.id}">
      <img src="${escapeShowcaseHtml(postImage(post))}" alt="">
      <div>
        <span class="method-pill">POST #${escapeShowcaseHtml(post.id)}</span>
        <h3>${escapeShowcaseHtml(postTitle(post))}</h3>
        <p>${escapeShowcaseHtml(postDescription(post))}</p>
        <a class="post-card-link" href="post.html?id=${encodeURIComponent(post.id)}">Открыть страницу поста</a>
      </div>
    </article>
  `).join('');

  document.querySelectorAll('.showcase-post-card').forEach((card) => {
    card.addEventListener('click', async () => {
      showcaseState.selectedPostId = Number(card.dataset.postId);
      await loadShowcaseComments(showcaseState.selectedPostId);
      renderShowcase();
    });
  });
}

function fillPostEditForm(post) {
  const form = document.getElementById('postEditForm');
  if (!form || !post) return;

  ['title', 'title_en', 'description', 'description_en', 'image', 'image_en'].forEach((field) => {
    const input = form.elements[field];
    if (input) input.value = post[field] || '';
  });
}

function renderArticle() {
  const box = document.getElementById('showcaseArticle');
  const editForm = document.getElementById('postEditForm');
  const commentForm = document.getElementById('commentCreateForm');
  const commentPlaceholder = document.getElementById('commentCreatePlaceholder');
  if (!box) return;

  const post = selectedPost();
  if (!post) {
    box.innerHTML = '<p class="muted-dark">Выберите пост или создайте новый пост в выбранной категории.</p>';
    editForm?.classList.add('hidden');
    commentForm?.classList.add('hidden');
    commentPlaceholder?.classList.remove('hidden');
    return;
  }

  box.innerHTML = `
    <img class="showcase-reader-image" src="${escapeShowcaseHtml(postImage(post))}" alt="">
    <p class="eyebrow">Selected article</p>
    <h2>${escapeShowcaseHtml(postTitle(post))}</h2>
    <p class="showcase-reader-text">${escapeShowcaseHtml(postDescription(post))}</p>
    <div class="showcase-meta">
      <span>ID: ${escapeShowcaseHtml(post.id)}</span>
      <span>Category: ${escapeShowcaseHtml(post.category_id || 'none')}</span>
    </div>
  `;

  editForm?.classList.remove('hidden');
  commentForm?.classList.remove('hidden');
  commentPlaceholder?.classList.add('hidden');
  fillPostEditForm(post);
}

function renderComments() {
  const box = document.getElementById('showcaseComments');
  if (!box) return;

  if (!showcaseState.selectedPostId) {
    box.innerHTML = '';
    return;
  }

  if (!showcaseState.comments.length) {
    box.innerHTML = '<p class="muted-dark">Комментариев пока нет. Напишите первый комментарий.</p>';
    return;
  }

  box.innerHTML = showcaseState.comments.map((comment) => `
    <div class="showcase-comment">
      <div class="comment-row">
        <strong>#${escapeShowcaseHtml(comment.id)}</strong>
        <button class="text-button" type="button" data-delete-comment="${comment.id}">Удалить</button>
      </div>
      <p>${escapeShowcaseHtml(comment.comment || comment.comment_en || 'Комментарий без текста')}</p>
    </div>
  `).join('');

  document.querySelectorAll('[data-delete-comment]').forEach((button) => {
    button.addEventListener('click', () => deleteComment(Number(button.dataset.deleteComment)));
  });
}

function renderShowcase() {
  renderCategories();
  renderPostCreateForm();
  renderPosts();
  renderArticle();
  renderComments();
}

function requireConfigOrUseDemo() {
  return showcaseState.demoMode || !showcaseConfigReady();
}

function formToBody(form, requiredFields = []) {
  const body = {};

  Array.from(form.elements).forEach((element) => {
    if (!element.name) return;
    const value = element.type === 'number'
      ? (element.value === '' ? null : Number(element.value))
      : element.value.trim();

    if (requiredFields.includes(element.name) && (value === '' || value === null)) {
      throw new Error(`Не хватает обязательного поля: ${element.name}`);
    }

    if (value !== '' && value !== null) {
      body[element.name] = value;
    } else if (['parent_id', 'client_id'].includes(element.name)) {
      body[element.name] = null;
    }
  });

  return body;
}

function clearForm(form) {
  Array.from(form.elements).forEach((element) => {
    if (element.name) element.value = '';
  });
}

async function createCategory(event) {
  event.preventDefault();
  const form = event.currentTarget;

  try {
    const body = formToBody(form, ['title', 'title_en', 'description', 'description_en', 'image']);

    if (requireConfigOrUseDemo()) {
      const category = { id: Date.now(), ...body };
      showcaseState.categories.unshift(category);
      showcaseState.selectedCategoryId = category.id;
      setShowcaseStatus('Категория добавлена в демо-режиме. Для сохранения в API введите ключи.', 'info');
    } else {
      await apiRequest('/category', { method: 'POST', body });
      await loadShowcaseData();
      setShowcaseStatus('Категория создана в API.', 'success');
    }

    clearForm(form);
    renderShowcase();
  } catch (error) {
    setShowcaseStatus(error.message, 'error');
  }
}

async function createPost(event) {
  event.preventDefault();
  const form = event.currentTarget;

  try {
    if (!showcaseState.selectedCategoryId) {
      throw new Error('Сначала выберите категорию.');
    }

    const body = formToBody(form, ['title', 'title_en', 'description', 'description_en', 'image', 'image_en']);
    body.category_id = Number(showcaseState.selectedCategoryId);

    if (requireConfigOrUseDemo()) {
      const post = { id: Date.now(), ...body };
      showcaseState.posts.unshift(post);
      showcaseState.selectedPostId = post.id;
      showcaseState.comments = [];
      setShowcaseStatus('Пост добавлен в демо-режиме. Для сохранения в API введите ключи.', 'info');
    } else {
      const post = await apiRequest('/post', { method: 'POST', body });
      showcaseState.selectedPostId = post?.id || showcaseState.selectedPostId;
      await loadShowcaseData();
      setShowcaseStatus('Пост создан в выбранной категории.', 'success');
    }

    clearForm(form);
    renderShowcase();
  } catch (error) {
    setShowcaseStatus(error.message, 'error');
  }
}

async function updateSelectedPost(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const post = selectedPost();

  try {
    if (!post) throw new Error('Сначала выберите пост.');

    const body = formToBody(form);

    if (requireConfigOrUseDemo()) {
      Object.assign(post, body);
      setShowcaseStatus('Пост изменён в демо-режиме.', 'info');
    } else {
      await apiRequest(`/post/${post.id}`, { method: 'PUT', body });
      await loadShowcaseData();
      setShowcaseStatus('Пост изменён в API.', 'success');
    }

    renderShowcase();
  } catch (error) {
    setShowcaseStatus(error.message, 'error');
  }
}

async function deleteSelectedPost() {
  const post = selectedPost();

  try {
    if (!post) throw new Error('Сначала выберите пост.');

    if (requireConfigOrUseDemo()) {
      showcaseState.posts = showcaseState.posts.filter((item) => Number(item.id) !== Number(post.id));
      showcaseState.comments = showcaseState.comments.filter((comment) => Number(comment.post_id) !== Number(post.id));
      setShowcaseStatus('Пост удалён в демо-режиме.', 'info');
    } else {
      await apiRequest(`/post/${post.id}`, { method: 'DELETE' });
      await loadShowcaseData();
      setShowcaseStatus('Пост удалён из API.', 'success');
    }

    ensureSelection();
    await loadShowcaseComments(showcaseState.selectedPostId, false);
    renderShowcase();
  } catch (error) {
    setShowcaseStatus(error.message, 'error');
  }
}

async function createComment(event) {
  event.preventDefault();
  const form = event.currentTarget;

  try {
    if (!showcaseState.selectedPostId) {
      throw new Error('Сначала выберите пост.');
    }

    const body = formToBody(form, ['comment', 'comment_en']);
    body.post_id = Number(showcaseState.selectedPostId);

    if (requireConfigOrUseDemo()) {
      showcaseState.comments.unshift({ id: Date.now(), ...body });
      setShowcaseStatus('Комментарий добавлен в демо-режиме.', 'info');
    } else {
      await apiRequest('/comment', { method: 'POST', body });
      await loadShowcaseComments(showcaseState.selectedPostId, false);
      setShowcaseStatus('Комментарий отправлен.', 'success');
    }

    clearForm(form);
    renderShowcase();
  } catch (error) {
    setShowcaseStatus(error.message, 'error');
  }
}

async function deleteComment(commentId) {
  try {
    if (requireConfigOrUseDemo()) {
      showcaseState.comments = showcaseState.comments.filter((comment) => Number(comment.id) !== Number(commentId));
      setShowcaseStatus('Комментарий удалён в демо-режиме.', 'info');
    } else {
      await apiRequest(`/comment/${commentId}`, { method: 'DELETE' });
      await loadShowcaseComments(showcaseState.selectedPostId, false);
      setShowcaseStatus('Комментарий удалён.', 'success');
    }

    renderShowcase();
  } catch (error) {
    setShowcaseStatus(error.message, 'error');
  }
}

document.getElementById('reloadShowcaseBtn')?.addEventListener('click', loadShowcaseData);
document.getElementById('categoryCreateForm')?.addEventListener('submit', createCategory);
document.getElementById('postCreateForm')?.addEventListener('submit', createPost);
document.getElementById('postEditForm')?.addEventListener('submit', updateSelectedPost);
document.getElementById('deleteSelectedPostBtn')?.addEventListener('click', deleteSelectedPost);
document.getElementById('commentCreateForm')?.addEventListener('submit', createComment);

loadShowcaseData();
