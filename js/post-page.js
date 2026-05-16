/*
  Детальная страница поста.
  Открывается по адресу post.html?id=POST_ID.
*/

const demoPostDetails = {
  101: {
    id: 101,
    category_id: 1,
    title: 'Как собрать красивый API-каталог',
    title_en: 'Build a beautiful API catalog',
    description: 'Практический пример публичной страницы с категориями, карточками и комментариями. На такой основе можно собрать блог, образовательную платформу или новостной портал.',
    description_en: 'A practical example with categories, cards and comments.',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1400',
  },
  102: {
    id: 102,
    category_id: 2,
    title: 'Учебная платформа на простом API',
    title_en: 'Learning platform on a simple API',
    description: 'Покажите уроки, разделы и обсуждения без сложной админки. API отдаёт данные, а статический frontend превращает их в полноценный продукт.',
    description_en: 'Show lessons, sections and discussions without a complex admin.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400',
  },
  103: {
    id: 103,
    category_id: 3,
    title: 'Новостной портал за один день',
    title_en: 'News portal in one day',
    description: 'Статический frontend может стать полноценным сайтом, если данные приходят из API. Это удобно для публикации на GitHub Pages.',
    description_en: 'A static frontend can become a full website when data comes from an API.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1400',
  },
};

const demoPostComments = [
  { id: 1, post_id: 101, comment: 'Отличная отдельная страница поста.', comment_en: 'Great post page.' },
  { id: 2, post_id: 101, comment: 'Теперь проект выглядит как реальный блог.', comment_en: 'Looks like a real blog now.' },
];

let postPageState = {
  post: null,
  comments: [],
  demoMode: true,
};

function postPageId() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get('id')) || 101;
}

function postPageConfigReady() {
  const config = loadConfig();
  return config.apiBase && config.token;
}

function setPostPageStatus(message, type = 'info') {
  const status = document.getElementById('postPageStatus');
  if (!status) return;
  status.textContent = message;
  status.className = `showcase-status ${type}`;
}

function escapePostPageHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function postTitle(post) {
  return post?.title || post?.title_en || `Post ${post?.id}`;
}

function postDescription(post) {
  return post?.description || post?.description_en || 'Описание пока не заполнено.';
}

function postImage(post) {
  return post?.image || post?.image_en || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1400';
}

async function loadPostPage() {
  const id = postPageId();

  if (!postPageConfigReady()) {
    postPageState.demoMode = true;
    postPageState.post = demoPostDetails[id] || demoPostDetails[101];
    postPageState.comments = demoPostComments.filter((comment) => Number(comment.post_id) === Number(postPageState.post.id));
    setPostPageStatus('Показаны демо-данные. Для реального API сохраните API Base URL и token на странице «Панель».', 'info');
    renderPostPage();
    return;
  }

  try {
    postPageState.demoMode = false;
    const [post, comments] = await Promise.all([
      apiRequest(`/post/${id}`),
      apiRequest(`/comment?post_id=${id}`),
    ]);

    postPageState.post = post;
    postPageState.comments = Array.isArray(comments) ? comments : [];
    setPostPageStatus('Пост загружен из API.', 'success');
    renderPostPage();
  } catch (error) {
    postPageState.demoMode = true;
    postPageState.post = demoPostDetails[id] || demoPostDetails[101];
    postPageState.comments = demoPostComments.filter((comment) => Number(comment.post_id) === Number(postPageState.post.id));
    setPostPageStatus(`API не ответил, показаны демо-данные. ${error.message}`, 'error');
    renderPostPage();
  }
}

function renderPostPage() {
  const post = postPageState.post;
  if (!post) return;

  document.title = `${postTitle(post)} - TheFrontend API Project`;
  document.getElementById('postPageHeader').textContent = postTitle(post);
  document.getElementById('postDetailImage').src = postImage(post);
  document.getElementById('postDetailTitle').textContent = postTitle(post);
  document.getElementById('postDetailDescription').textContent = postDescription(post);
  document.getElementById('postDetailMeta').textContent = post.title_en || 'Post detail';
  document.getElementById('postDetailId').textContent = `ID: ${post.id}`;
  document.getElementById('postDetailCategory').textContent = `Category: ${post.category_id || 'none'}`;

  renderPostPageComments();
}

function renderPostPageComments() {
  const box = document.getElementById('postPageComments');
  if (!box) return;

  if (!postPageState.comments.length) {
    box.innerHTML = '<p class="muted-dark">Комментариев пока нет. Напишите первый комментарий.</p>';
    return;
  }

  box.innerHTML = postPageState.comments.map((comment) => `
    <div class="showcase-comment">
      <strong>#${escapePostPageHtml(comment.id)}</strong>
      <p>${escapePostPageHtml(comment.comment || comment.comment_en || 'Комментарий без текста')}</p>
    </div>
  `).join('');
}

function commentFormBody(form) {
  const comment = form.elements.comment.value.trim();
  const commentEn = form.elements.comment_en.value.trim();
  const parentRaw = form.elements.parent_id.value;

  if (!comment) throw new Error('Не хватает обязательного поля: comment');
  if (!commentEn) throw new Error('Не хватает обязательного поля: comment_en');

  return {
    post_id: Number(postPageState.post.id),
    comment,
    comment_en: commentEn,
    parent_id: parentRaw === '' ? null : Number(parentRaw),
  };
}

async function createPostPageComment(event) {
  event.preventDefault();
  const form = event.currentTarget;

  try {
    const body = commentFormBody(form);

    if (postPageState.demoMode || !postPageConfigReady()) {
      postPageState.comments.unshift({ id: Date.now(), ...body });
      setPostPageStatus('Комментарий добавлен в демо-режиме.', 'info');
    } else {
      await apiRequest('/comment', { method: 'POST', body });
      postPageState.comments = await apiRequest(`/comment?post_id=${postPageState.post.id}`);
      setPostPageStatus('Комментарий отправлен в API.', 'success');
    }

    form.reset();
    renderPostPageComments();
  } catch (error) {
    setPostPageStatus(error.message, 'error');
  }
}

document.getElementById('postPageCommentForm')?.addEventListener('submit', createPostPageComment);

loadPostPage();
