export const needsStrategicAxes = [
  {
    dataItems: {
      domaine: "Marketing",
      theme: "Marketing Control",
      source: "Facebook",
      noGroup: " 1",
      site: "facebook",
      department: "Sales",
      status: "Draft",
    },
    isPending: true,
  },
  {
    dataItems: {
      domaine: "Quality",
      theme: "Food security",
      source: "Instal",
      noGroup: "3",
      site: "insta",
      department: "Sales",
      status: "Valid",
    },
    isPending: false,
  },

  {
    dataItems: {
      domaine: "Finance ",
      theme: "Social Media",
      source: "twiter",
      noGroup: "1",
      site: "twiter",
      department: "Sales",
      status: "Draft",
    },
    isPending: true,
  },
  {
    dataItems: {
      domaine: "Marketing",
      theme: "Social Media",
      source: "Facebook",
      noGroup: "3",
      site: "facebook",
      department: "Sales",
      status: "Valid",
    },
    isPending: false,
  },
  {
    dataItems: {
      domaine: "Finance ",
      theme: "Social Media",
      source: "twiter",
      noGroup: "1",
      site: "twiter",
      department: "Sales",
      status: "Draft",
    },
    isPending: true,
  },
];

export const totalRecords = needsStrategicAxes.length;

export const pagination = {
  currentPage: 1,
  pageDetails: {
    totalPages: 5,
    recordsPerPage: 2,
  },
  setCurrentPage: (page) => console.log("Current page:", page),
};
