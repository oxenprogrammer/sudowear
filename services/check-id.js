module.exports = (userId, paramId) => {
  if (paramId !== userId) {
    return res.status(403).json({
      errors: [
        {
          msg: `Unauthorized Operation. FORBIDDEN`,
        },
      ],
    });
  }
};
