import {
  computePosition,
  flip,
  shift,
  offset,
  autoUpdate,
} from 'https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.6.10/+esm';

// make the token available to ajax
const csrftoken = Cookies.get('csrftoken');

const loader = `<div class="spinner-grow text-primary" role="status">
  <span class="sr-only">Loading...</span>
</div>`;

function updateModal(title, cancelBtn, postBtn) {
  $('#general_modal .modal-title').text(title);
  $('#general_modal .btn-secondary').text(cancelBtn);
  $('#general_modal .btn-primary').text(postBtn);
  $('#general_modal').modal('show');
}

/*=============================================
=                Error Handling               =
=============================================*/
function showErrorOrInfo(response, error) {
  let text;
  if (response.responseJSON?.text) {
    text = response.responseJSON.text;
  } else {
    text = 'An error has occurred';
    error = true;
  }
  const container = $('.toast-container');
  $(container).find('.toast.hide').remove();
  const toastHtml = document.createElement('div');
  $(toastHtml)
    .attr(
      'class',
      `toast ${
        error ? 'bg-danger' : 'bg-info'
      } d-flex align-items-center justify-content-between`
    )
    .attr('role', 'alert')
    .attr('aria-live', 'assertive')
    .attr('aria-atomic', 'true')
    .html(
      `<div class="toast-body text-white">
      ${text}
    </div>
    <button type="button" class="btn-close btn-close-white me-2" data-bs-dismiss="toast" aria-label="Close"></button> `
    );
  $(container).append(toastHtml);
  const toast = bootstrap.Toast.getOrCreateInstance(toastHtml);
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

function makeMenuHtml(collections) {
  let htmlOut = '<form class="collection-list"><ul class="list-group">';
  for (const collection of collections)
    htmlOut += `<li class="list-group-item d-flex justify-content-between">
<input type="checkbox" class="btn-check" id="col-${
      collection.id
    }" autocomplete="off" value="${collection.id}" aria-label="add post to ${
      collection.name
    }" ${collection.checked ? 'checked' : ''} name="collection">
<label class="btn btn-primary w-100 text-center" for="col-${collection.id}">${
      collection.name
    }</label>
    </li>`;
  htmlOut += `</ul></form>
  <form class="add-collection">
    <button type="button" class="btn btn-primary w-100 mt-2"
    aria-label="create new Collection">
      <i class="fas fa-plus"></i>
    </button>
          <input class="form-control mt-2" type="text"
          placeholder="New Collection Name" aria-label="Enter new
          Collection name and press enter to create" required>
  </form>
      `;
  return htmlOut;
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
            .append(
              `<li class="list-group-item d-flex justify-content-between">
<input type="checkbox" class="btn-check" id="col-${collection.id}"
autocomplete="off" value="${collection.id}" aria-label="add post
to ${collection.name}" name="collection" checked>
<label class="btn btn-primary w-100 text-center"
for="col-${collection.id}">${collection.name}</label>
</li>`
            );
          $(menu)
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
      $('#general_modal').modal('hide');
      $.ajax({
        type: 'POST',
        url: url,
        data: $('#delete_collection_form').serialize(),
        success: () => {
          // @TODO: just remove the deleted collection, instead of reloading
          window.location.replace('');
        },
        error: (data) => {
          showError(data.text);
        },
      });
    });
  $.ajax({
    type: 'GET',
    url: url,
    data: $('#delete_post_form').serialize(),
    beforeSend: () => {
      $('#general_modal .modal-body').html(loader);
    },
    success: (data) => {
      $('#general_modal .modal-body').html(data);
    },
    error: (data) => {
      showError(data.text);
    },
  });
});
