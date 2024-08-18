/*=============================================
=                 Action Menu                 =
=============================================*/

const createPostBtn = document.getElementById('create_post_btn');
$('#create_post_btn').on('click', () => {
  $('#general_modal .modal-title').text('Create Post');
  $('#general_modal button[data-bs-dismiss]').text('Cancel');
  $('#general_modal .btn-primary').text('Post');
  $.get('create-post', (data, status) => {
    $('#general_modal .modal-body').html(data);
    // @TODO: Handle errors
  });
});
