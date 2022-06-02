using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using Firebase;
using Firebase.Database;
public class CubeManager : MonoBehaviour
{
    public int m_layers;
    public Dictionary<string, Cube> m_cubes;
    public GameObject m_cubePrefab;
    public FirebaseDBManager m_dbManager;

    private void Awake()
    {

        m_cubes = new Dictionary<string, Cube>();
    }
    // Start is called before the first frame update
    void Start()
    {

        


        m_layers = 30;
        //Generate();
    }

    // Update is called once per frame
    void Update()
    {
        
    }



    public void GenerateFromServer(List<CubeData> a_list)
    {
        foreach (CubeData x in a_list)
        {
            if (x.m_health > 0)
            {
                GameObject go = Instantiate(m_cubePrefab);

                m_cubes.Add(x.m_id, go.GetComponent<Cube>());
                go.GetComponent<Cube>().m_databaseID = x.m_id;
                go.GetComponent<Cube>().m_health = x.m_health;
                go.name = x.m_id;
                go.GetComponent<MeshRenderer>().material.color = new Color(m_layers / 8, 1, 1);
                go.transform.position = x.m_pos;
            }
        }
    }

    public void Generate()
    {
       

        for (int tempLayerCount = m_layers-2; tempLayerCount <= m_layers; tempLayerCount+=2)
        {
            
            for (int x = 0; x < tempLayerCount; x++)
            {
                for (int y = 0; y < tempLayerCount; y++)
                {
                    for (int z = 0; z < tempLayerCount; z++)
                    {
                        if (x == 0 || x == tempLayerCount - 1 || y == 0 || y == tempLayerCount - 1 || z == 0 || z == tempLayerCount - 1)
                        {
                            Vector3 cubePos = new Vector3(x - (tempLayerCount / 2), y - (tempLayerCount / 2), z - (tempLayerCount / 2));
                            var go = Instantiate(m_cubePrefab);
                            m_cubes.Add(tempLayerCount + "-" + x + "," + y + "," + z,go.GetComponent<Cube>());
                            go.GetComponent<Cube>().m_databaseID = tempLayerCount + "-" + x + "," + y + "," + z;
                            go.GetComponent<Cube>().m_health = tempLayerCount * 10;
                            go.name = tempLayerCount + "-" + x + "," + y + "," + z;
                            m_dbManager.AddCubeReference(tempLayerCount + "-" + x + "," + y + "," + z, tempLayerCount * 10, cubePos);
                            go.GetComponent<MeshRenderer>().material.color = new Color(m_layers / 8, 1, 1);
                            go.transform.position = cubePos;
                        }
                    }
                }
            }
        }
        m_layers = m_layers - 4;
    }

    public void RevealNextStage()
    {
        for (int x = 0; x < m_layers; x++)
        {
            for (int y = 0; y < m_layers; y++)
            {
                for (int z = 0; z < m_layers; z++)
                {
                    if (x == 0 || x == m_layers - 1 || y == 0 || y == m_layers - 1 || z == 0 || z == m_layers - 1)
                    {

                        var go = Instantiate(m_cubePrefab);
                        go.GetComponent<MeshRenderer>().material.color = new Color(m_layers / 8, 1, 1);
                        go.transform.position = new Vector3(x - (m_layers / 2), y - (m_layers / 2), z - (m_layers / 2));
                    }
                }
            }
        }
        m_layers = m_layers - 2;
    }

   public void UpdateCube(string a_cubeRef, int a_health)
    {
        m_cubes[a_cubeRef].m_health = a_health;

    }

    public void RemoveCube(string a_cubeRef)
    {
        if (m_cubes.ContainsKey(a_cubeRef))
        {
            Destroy(m_cubes[a_cubeRef].gameObject);
            m_cubes.Remove(a_cubeRef);
        }
    }

    public Vector3 StringToVector3(string sVector)
    {
        // Remove the parentheses
        if (sVector.StartsWith("(") && sVector.EndsWith(")"))
        {
            sVector = sVector.Substring(1, sVector.Length - 2);
        }

        // split the items
        string[] sArray = sVector.Split(',');

        // store as a Vector3
        Vector3 result = new Vector3(
            float.Parse(sArray[0]),
            float.Parse(sArray[1]),
            float.Parse(sArray[2]));

        return result;
    }
}
