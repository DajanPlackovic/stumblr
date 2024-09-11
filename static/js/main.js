import {
  computePosition,
  flip,
  shift,
  offset,
  autoUpdate,
} from 'https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.6.10/+esm';

// make the token available to ajax
const csrftoken = Cookies.get('csrftoken');

const loader = $('#loader').html();

function updateModal(title, cancelBtn, postBtn) {
  $('#general_modal')
    .find('.modal-title')
    .text(title)
    .end()
    .find('btn-secondary')
    .text(cancelBtn)
    .end()
    .find('.btn-primary')
    .text(postBtn)
    .end()
    .modal('show');
}

/*=============================================
=                Error Handling               =
=============================================*/
function showErrorOrInfo(response, error) {
  let text;
  let className = error ? 'bg-danger' : 'bg-info';
  if (error) {
    if (response.responseJSON && response.responseJSON.text) {
      text = response.responseJSON.text;
    } else {
      text = 'An error has occurred';
      className = 'bg-danger';
    }
  } else {
    text = response;
  }
  const container = $('.toast-container');
  // clean up toasts that were already hidden
  $(container).find('.toast.hide').remove();
  const toastHtml = document.createElement('div');
  $(toastHtml)
    .html($('template#toast').html())
    .find('.toast')
    .addClass(className)
    .find('.toast-body')
    .html(text);
  const toastOut = $(toastHtml).find('.toast');
  $(container).append(toastOut);
  const toast = bootstrap.Toast.getOrCreateInstance(toastOut);
  toast.show();
}

const showError = (text) => showErrorOrInfo(text, true);
const showInfo = (text) => showErrorOrInfo(text, false);

/*=============================================
=                Ajax Wrappers                =
=============================================*/

function ajaxWrapper(type, rest = {}) {
  rest.type = type;
  rest.error = (data) => {
    showError(data);
  };
  $.ajax(rest);
}

const ajaxGet = (rest = {}) => ajaxWrapper('GET', rest);
const ajaxPost = (rest = {}) => {
  rest.headers = {
    'X-CSRFToken': csrftoken,
  };
  rest.mode = 'same-origin';
  ajaxWrapper('POST', rest);
};

/*=============================================
=          Render Frontend Templates          =
=============================================*/

function renderTemplate(data, html) {
  const { fill, condition } = data;
  console.log(fill);
  console.log(condition);
  if (fill) {
    for (const key of Object.keys(fill)) {
      html = html.replaceAll(`|| ${key} ||`, fill[key]);
    }
  }
  if (condition) {
    for (const key of Object.keys(condition)) {
      const bracket = `\\\{\\\| ${key} \\\|\\\}`;
      const pattern = new RegExp(`${bracket}([\\S\\s]*)${bracket}`, 'g');
      if (condition[key]) {
        html = html.replaceAll(pattern, '$1');
      } else {
        html = html.replaceAll(pattern, '');
      }
    }
  }
  return html;
}

/*=============================================
=                 Action Menu                 =
=============================================*/

$('#create_post_btn').on('click', () => {
  updateModal('Create Post', 'Cancel', 'Post');
  const url = '/create-post';
  const form = '#create_post_form';
  $('#general_modal .btn-primary').on('click', () => {
    const data = $(form).serialize();
    const success = (data) => {
      $('#general_modal').modal('hide');
      const postContainer = $('#post_container');
      let message = 'Post successfully created.';
      if (postContainer[0]) {
        const postTemplate = $('template#post').html();
        postContainer.prepend(renderTemplate(data, postTemplate));
        const newPost = $('#post_container').children().first();
        newPost
          .find('button[data-action="add_to_collection"]')
          .on('click', addToCollection)
          .end()
          .find('button[data-action="edit"]')
          .on('click', editPost)
          .end()
          .find('button[data-action="delete"]')
          .on('click', deletePost);
      } else {
        message += `\n<a href="/">View here.</a>`;
      }
      showInfo(message);
      $('#general_modal .btn-primary').off('click');
    };
    ajaxPost({ url, data, success });
  });
  const beforeSend = () => {
    $('#general_modal .modal-body').html(loader);
  };
  const success = (data) => {
    $('#general_modal .modal-body').html(data);
  };
  ajaxGet({ url, beforeSend, success });
});

/*=============================================
=              Action Menu Posts              =
=============================================*/
function deletePost(e) {
  e.preventDefault();
  const button = this;
  const url = `/delete-post/${$(button).attr('data-post')}`;
  updateModal('Delete Post', 'Cancel', 'Delete');
  $('#general_modal .btn-primary')
    .addClass('btn-danger')
    .on('click', () => {
      const data = $('#delete_post_form').serialize();
      function success() {
        $('#general_modal').modal('hide');
        $(button).parents('.item-card').remove();
        showInfo('Post deleted successfully');
      }
      function complete() {
        $('#general_modal .btn-primary').off('click').removeClass('btn-danger');
      }
      ajaxPost({ url, data, success, complete });
    });
  const beforeSend = () => {
    $('#general_modal .modal-body').html(loader);
  };
  const success = (data) => {
    let post = $('template#post').html();
    $('#general_modal .modal-body').html(renderTemplate(data, post));
  };
  ajaxGet({ url, beforeSend, success });
}

$('button[data-action="delete"]').on('click', deletePost);

function editPost(e) {
  e.preventDefault();
  const url = `/edit-post/${$(this).attr('data-post')}`;
  const textCard = $(this).parents('.item-card').find('.card-text');
  updateModal('Edit Post', 'Cancel', 'Post');
  $('#general_modal .btn-primary').on('click', () => {
    const newText = $('#create_post_form textarea').val();
    const data = { text: newText };
    const success = (data) => {
      $('#general_modal').modal('hide');
      textCard.text(data.text);
      showInfo('Post successfully edited.');
      $('#general_modal .btn-primary').off('click');
    };
    ajaxPost({ url, data, success });
  });
  const beforeSend = () => {
    $('#general_modal .modal-body').html(loader);
  };
  const success = (data) => {
    $('#general_modal .modal-body').html(data);
  };
  ajaxGet({ url, beforeSend, success });
}

$('button[data-action="edit"]').on('click', editPost);

/*=============================================
=              Add to Collection              =
=============================================*/
function floatMenu(btn, menu) {
  // Positioning logic from FloatingUI, https://floating-ui.com/docs/tutorial
  return autoUpdate(btn, menu, () => {
    computePosition(btn, menu, {
      placement: 'bottom',
      middleware: [offset(0), flip(), shift()],
    }).then(({ x, y }) => {
      Object.assign(menu.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  });
}

function makeMenuItem(collection) {
  return $($('template#collection-menu__item').html())
    .find('input[type="checkbox"]')
    .attr({
      id: `col-${collection.id}`,
      value: collection.id,
      'aria-label': `add post to ${collection.name}`,
      checked: collection.checked,
    })
    .end()
    .find('label')
    .attr('for', `col-${collection.id}`)
    .text(collection.name)
    .end()
    .find('button[data-action="edit_collection"]')
    .attr('data-post', collection.id)
    .end();
}

function makeMenuHtml(collections) {
  const container = document.createElement('div');
  $(container)
    .html($('template#collection-menu__container').html())
    .find('.collection-list');
  for (const collection of collections) {
    const item = makeMenuItem(collection);
    $(container).find('.collection-list .list-group').append(item);
  }
  return $(container).html();
}
function addToCollection() {
  const btn = this;
  const menu = $(btn).next()[0];
  const url = `/collection-menu/${$(btn).attr('data-post')}`;
  let populated = false;
  $(menu).show().html(loader);

  const cleanup = floatMenu(btn, menu);

  ajaxGet({ url, success: buildMenu });

  function buildMenu(data) {
    const { response } = data;
    const menuHtml = makeMenuHtml(response);
    $(menu).html(menuHtml).find('.add-collection input').hide();

    /*----------  Add collection logic  ----------*/
    $(menu).find('.add-collection button').on('click', addCollection);
    $(btn).off('click');

    hideAndPostOnClose();
    registerEditEvent();
    populated = true;
  }

  function hideAndPostOnClose() {
    $(document).on('click', function (event) {
      if (!menu.contains(event.target)) {
        if (populated) {
          const formData = $(menu).find('.collection-list').serialize();
          const data = formData ? formData
            : $.param({ collection: 'empty' }, true);
          $(menu).html(loader);
          const success = () => {
            $(menu).hide();
            cleanup(); // stop tracking menu position
            $(btn).on('click', addToCollection);
          };
          ajaxPost({ url, data, success });
          populated = false;
        }
        $(document).off('click');
      }
    });
  }
  function addCollection() {
    $('.add-collection')
      .find('button')
      .hide()
      .end()
      .find('input')
      .show()
      .focus()
      .end()
      .on('submit', function (e) {
        e.preventDefault();
        const name = $(this).find('input').val();
        const url = '/create-collection';
        const success = (collection) => {
          $(menu)
            .find('.collection-list')
            .append(makeMenuItem(collection))
            .find('input[type="text"]')
            .hide()
            .end()
            .end()
            .find('.add-collection input')
            .hide()
            .parent()
            .find('button')
            .show();
        };
        ajaxPost({ url, data: { name }, success });
      });
  }
  function registerEditEvent() {
    $(menu)
      .find('input[type="text"]')
      .hide()
      .end()
      .find('button[data-action="edit_collection"]')
      .on('click', editCollectionName);
  }

  function editCollectionName(clickEvent) {
    const editBtn = clickEvent.currentTarget;
    const input = $(editBtn).parents('li').find('input[type="text"]');
    $(editBtn).parents('.list-group-item > .row').hide();
    $(input)
      .show()
      .focus()
      .on('keypress', (e) => {
        if (e.key == 'Enter') {
          const id = $(editBtn).attr('data-post');
          const name = $(input).val();
          const url = `edit-collection/${id}`;
          const success = () => {
            $(input).hide();
            $(editBtn)
              .parents('.list-group-item > .row')
              .show()
              .find('label')
              .text(name);
          };
          ajaxPost({ url, data: { name }, success });
        }
      });
  }
}

$('button[data-action="add_to_collection"]').on('click', addToCollection);

/*=============================================
=              Delete Collection              =
=============================================*/
$('button[data-action="delete-collection"]').on('click', function (e) {
  e.preventDefault();
  const button = this;
  const url = `/delete-collection/${$(button).attr('data-post')}`;
  updateModal('Delete Collection', 'Cancel', 'Delete');
  $('#general_modal .btn-primary')
    .addClass('btn-danger')
    .on('click', () => {
      const data = $('#delete_collection_form').serialize();
      const success = () => {
        $(button).parents('.item-card').remove();
        $('#general_modal').modal('hide');
      };
      ajaxPost({ url, data, success });
    });
  const beforeSend = () => {
    $('#general_modal .modal-body').html(loader);
  };
  const success = (data) => {
    $('#general_modal .modal-body').html(data);
  };
  ajaxGet({ url, beforeSend, success });
});

/*=============================================
=               Infinite Scroll               =
=============================================*/

function scroll(scrollMarker, post) {
  const rect = scrollMarker.getBoundingClientRect();
  let url = post ? 'post-list' : 'collection-list';
  url += `?page=${$(scrollMarker).attr('data-page')}`;
  const contentId = post ? '#post_container' : '#collection_container';
  if (rect.top < document.documentElement.clientHeight + 1000) {
    $(scrollMarker).remove();
    const success = (data) => {
      $(contentId).append(data);
    };
    ajaxGet({ url, success });
  }
}

if ($('.scroll').attr('data-page')) {
  $(document).on('scroll', () => {
    const scrollPosts = $('.scroll[data-type="posts"]').get(0);
    const scrollCollections = $('.scroll[data-type="collections"]').get(0);
    if (scrollPosts) scroll(scrollPosts, true);
    if (scrollCollections) scroll(scrollCollections, false);
  });
}

/*=============================================
=                 Follow User                 =
=============================================*/

function followUnfollow(button, url, success) {
  const data = { followed: $(button).attr('data-post') };
  ajaxPost({ url, data, success });
}

function follow(e) {
  const button = e.currentTarget;
  const url = `/follow/`;
  const success = () => {
    $(button).attr('data-action', 'unfollow');
    $(button).text('Unfollow');
    $(button).off('click');
    $(button).on('click', unfollow);
  };
  followUnfollow(button, url, success);
}

function unfollow(e) {
  const button = e.currentTarget;
  const url = '/unfollow/';
  const success = () => {
    $(button).attr('data-action', 'follow');
    $(button).text('Follow');
    $(button).off('click');
    $(button).on('click', follow);
  };
  followUnfollow(button, url, success);
}

$('button[data-action="follow"]').on('click', follow);
$('button[data-action="unfollow"]').on('click', unfollow);

/*=============================================
=              Change Color Theme             =
=============================================*/

$('button#theme_btn').on('click', () => {
  const html = $('html');
  const url = '/set-theme';
  if (html.attr('data-bs-theme') == 'light') {
    html.attr('data-bs-theme', 'dark');
    const data = { theme: 'dark' };
    ajaxPost({ url, data });
  } else {
    html.attr('data-bs-theme', 'light');
    const data = { theme: 'light' };
    ajaxPost({ url, data });
  }
});
