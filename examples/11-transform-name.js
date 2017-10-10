module.exports = function (migration) {
  const dog = migration.editContentType('dog');

  dog.createField('owner4')
    .type('Symbol')
    .name('Owner name')
    .required(false);

  dog.transformContent({
    from: ['name'],
    to: ['owner4'],
    transform: ([name]) => [`${name}'s owner`]
  });
};
