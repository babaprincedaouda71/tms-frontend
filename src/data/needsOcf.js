export const needsOcf = [
  {
    dataItems: {
      ref: "1",
      domaine: "Marketing",
      theme: "Astra",
      site: " Facebook",
      department: " App Development",
      status: " Active",
    },
    isPending: true,
  },
  {
    dataItems: {
      ref: "1",
      domaine: "Marketing",
      theme: "Astra",
      site: " Facebook",
      department: " App Development",
      status: " Active",
    },
    isPending: false,
  },
];

export const totalRecords = needsOcf.length;

export const pagination = {
  currentPage: 1,
  pageDetails: {
    totalPages: 5,
    recordsPerPage: 2,
  },
  setCurrentPage: (page) => console.log("Current page:", page),
};
