import {
  computePosition,
  flip,
  shift,
  offset,
} from 'https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.6.10/+esm';

function updateModal(title, cancelBtn, postBtn) {
  $('#general_modal .modal-title').text(title);
  $('#general_modal button[data-bs-dismiss]').text(cancelBtn);
  $('#general_modal .btn-primary').text(postBtn);
  $('#general_modal').modal('show');
}

/*=============================================
=                 Action Menu                 =
=============================================*/

const createPostBtn = document.getElementById('create_post_btn');
$('#create_post_btn').on('click', () => {
  updateModal('Create Post', 'Cancel', 'Post');
  $('#general_modal .btn-primary').on('click', () => {
    $('#general_modal').modal('hide');
    $.post('create-post', $('#create_post_form').serialize()).done(() => {
      window.location.replace('');
    });
    // @TODO: if user is already on posts page, insert post instead of reloading
  });
  $.get('create-post', (data, status) => {
    $('#general_modal .modal-body').html(data);
    // @TODO: Handle errors
  });
});

/*=============================================
=              Action Menu Posts              =
=============================================*/

$('button[data-action="delete"]').on('click', function (e) {
  e.preventDefault();
  const url = `delete-post/${$(this).attr('data-post')}`;
  updateModal('Delete Post', 'Cancel', 'Delete');
  $('#general_modal .btn-primary')
    .addClass('btn-danger')
    .on('click', () => {
      $('#general_modal').modal('hide');
      $.ajax({
        type: 'POST',
        url: url,
        data: $('#delete_post_form').serialize(),
      }).done(() => {
        // @TODO: just remove the deleted post, instead of reloading
        window.location.replace('');
      });
    });
  $.ajax({
    type: 'GET',
    url: url,
    data: $('#delete_post_form').serialize(),
    beforeSend: () => {
      $('#general_modal .modal-body').html(
        `<div class="spinner-grow" role="status">
  <span class="sr-only">Loading...</span>
</div>`
      );
    },
    success: (data) => {
      $('#general_modal .modal-body').html(data);
    },
  });
});

/*=============================================
=              Add to Collection              =
=============================================*/
$('button[data-action="add_to_collection"]').on('click', function () {
  const menu = $(this).next()[0];
  const btn = this;
  if ($(menu).hasClass('show')) {
    $(menu).removeClass('show');
    return;
  }
  $(menu)
    .addClass('show')
    .html(
      `<div class="spinner-grow" role="status">
  <span class="sr-only">Loading...</span>
</div>`
    );

  // Positioning logic from FloatingUI, https://floating-ui.com/docs/tutorial
  computePosition(btn, menu, {
    placement: 'bottom',
    middleware: [offset(0), flip(), shift({ padding: 0 })],
  }).then(({ x, y }) => {
    Object.assign(menu.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });

  // Hide if clicked away
  $(document).on('click', function (event) {
    if (!(menu.contains(event.target) || btn.contains(event.target))) {
      $(menu).removeClass('show');
      return;
    }
  });

  $.ajax({
    type: 'GET',
    url: 'collection-menu',
    success: (data) => {
      $(menu).html(data);
    },
  });
});
