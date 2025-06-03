export const needsOcfCatalog = [
  {
    dataItems: {
      ref: "1",
      domaine: "Marketing",
      theme: "Astra",
      plan: " Development",
      department: " App Development",
      site: " Facebook",
    },
    isPending: true,
  },
  {
    dataItems: {
      ref: "1",
      domaine: "Marketing",
      theme: "Astra",
      plan: " Development",
      department: " App Development",
      site: " Facebook",
    },
    isPending: false,
  },
];

export const totalRecords = needsOcfCatalog.length;

export const pagination = {
  currentPage: 1,
  pageDetails: {
    totalPages: 5,
    recordsPerPage: 2,
  },
  setCurrentPage: (page) => console.log("Current page:", page),
};
