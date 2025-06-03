export const needsDashboardCatalog = [
  {
    dataItems: {
      ref: "",
      domaine: "",
      theme: "",
      ocf: "",
      site: "",
      department: "",
      status: "",
    },
    isPending: true,
  },
  {
    dataItems: {
      ref: "",
      domaine: "",
      theme: "",
      ocf: "",
      site: "",
      department: "",
      status: "",
    },
    isPending: false,
  },
];

export const totalRecords = needsDashboardCatalog.length;

export const pagination = {
  currentPage: 1,
  pageDetails: {
    totalPages: 5,
    recordsPerPage: 2,
  },
  setCurrentPage: (page) => console.log("Current page:", page),
};
