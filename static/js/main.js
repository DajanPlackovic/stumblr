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
  if (response.responseJSON?.text) {
    text = response.responseJSON.text;
  } else {
    text = 'An error has occurred';
    className = 'bg-danger';
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
    .text(text);
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
  $.ajax({
    type: type,
    error: (data) => {
      showError(data);
    },
    ...rest,
  });
}

const ajaxGet = (rest = {}) => ajaxWrapper('GET', rest);
const ajaxPost = (rest = {}) =>
  ajaxWrapper('POST', {
    ...rest,
    headers: {
      'X-CSRFToken': csrftoken,
    },
    mode: 'same-origin',
  });
/*=============================================
=                 Action Menu                 =
=============================================*/

$('#create_post_btn').on('click', () => {
  updateModal('Create Post', 'Cancel', 'Post');
  const url = '/create-post';
  const form = '#create_post_form';
  $('#general_modal .btn-primary').on('click', () => {
    const data = $(form).serialize();
    const success = () => {
      $('#general_modal').modal('hide');
      // @TODO: if user is already on posts page, insert post instead of reloading
      window.location.replace('');
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

$('button[data-action="delete"]').on('click', function (e) {
  e.preventDefault();
  const url = `/delete-post/${$(this).attr('data-post')}`;
  updateModal('Delete Post', 'Cancel', 'Delete');
  $('#general_modal .btn-primary')
    .addClass('btn-danger')
    .on('click', () => {
      const data = $('#delete_post_form').serialize();
      const success = () => {
        $('#general_modal').modal('hide');
        // @TODO: just remove the deleted post, instead of reloading
        window.location.replace('');
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
    .find('input')
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
    .end();
}

function makeMenuHtml(collections) {
  const container = document.createElement('div');
  $(container)
    .html($('template#collection-menu__container').html())
    .find('.collection-list');
  for (const collection of collections) {
    const item = makeMenuItem(collection);
    $(container).find('.collection-list').append(item);
  }
  return $(container).html();
}
function buttonAction() {
  const btn = this;
  const menu = $(btn).next()[0];
  const url = `/collection-menu/${$(btn).attr('data-post')}`;
  let populated = false;
  $(menu).show().html(loader);

  const cleanup = floatMenu(btn, menu);
  hideAndPostOnClose();

  ajaxGet({ url, success: buildMenu });

  function hideAndPostOnClose() {
    $(document).on('click', function (event) {
      if (!(menu.contains(event.target) || btn.contains(event.target))) {
        if (populated) {
          const formData = $(menu).find('.collection-list').serialize();
          const data = formData
            ? formData
            : $.param({ collection: 'empty' }, true);
          $(menu).html(loader);
          $(btn).off('click');
          const success = () => {
            $(menu).hide();
            cleanup(); // stop tracking menu position
            $(btn).on('click', buttonAction);
          };
          ajaxPost({ url, data, success });
          populated = false;
        }
        $(document).off('click');
      }
    });
  }
  function buildMenu(data) {
    const { response } = data;
    const menuHtml = makeMenuHtml(response);
    $(menu).html(menuHtml).find('.add-collection input').hide();

    /*----------  Add collection logic  ----------*/
    $(menu).find('.add-collection button').on('click', addCollection);
    populated = true;
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
}

$('button[data-action="add_to_collection"]').on('click', buttonAction);

/*=============================================
=              Delete Collection              =
=============================================*/
$('button[data-action="delete-collection"]').on('click', function (e) {
  e.preventDefault();
  const url = `/delete-collection/${$(this).attr('data-post')}`;
  updateModal('Delete Collection', 'Cancel', 'Delete');
  $('#general_modal .btn-primary')
    .addClass('btn-danger')
    .on('click', () => {
      const data = $('#delete_collection_form').serialize();
      const success = () => {
        // @TODO: just remove the deleted collection, instead of reloading
        window.location.replace('');
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
